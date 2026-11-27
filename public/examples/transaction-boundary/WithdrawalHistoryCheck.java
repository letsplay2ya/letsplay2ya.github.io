import java.util.List;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/** A synthetic transaction experiment. The records are isolated from the application database. */
public class WithdrawalHistoryCheck {
    enum Scenario { SUCCESS, SECOND_DOCUMENT, BEFORE_FIRST_DOCUMENT, HISTORY_WRITE_FAILS }

    record Result(String account, int pendingDocuments, List<String> failures) {}

    static Result run(Scenario scenario) {
        JdbcDataSource source = new JdbcDataSource();
        source.setURL("jdbc:h2:mem:withdraw_" + scenario + ";DB_CLOSE_DELAY=-1");
        JdbcTemplate db = new JdbcTemplate(source);
        db.execute("create table customer (id int primary key, state varchar(20))");
        db.execute("create table document (id varchar(8) primary key, state varchar(20))");
        db.execute("create table failure_history (document_id varchar(8) not null)");
        db.update("insert into customer values (1, 'active')");
        db.update("insert into document values ('A', 'kept'), ('B', 'kept')");

        var manager = new DataSourceTransactionManager(source);
        var business = new TransactionTemplate(manager);
        var history = new TransactionTemplate(manager);
        history.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            business.executeWithoutResult(ignored -> {
                db.update("update customer set state = 'requested' where id = 1");
                if (scenario == Scenario.BEFORE_FIRST_DOCUMENT) {
                    throw new IllegalStateException("No document was identified");
                }
                for (String id : List.of("A", "B")) {
                    db.update("update document set state = 'pending' where id = ?", id);
                    if (id.equals("B") && scenario != Scenario.SUCCESS) {
                        try {
                            history.executeWithoutResult(inner -> {
                                if (scenario == Scenario.HISTORY_WRITE_FAILS) {
                                    throw new IllegalStateException("History sink unavailable");
                                }
                                db.update("insert into failure_history values (?)", id);
                            });
                        } catch (IllegalStateException unavailable) {
                            if (scenario != Scenario.HISTORY_WRITE_FAILS) throw unavailable;
                        }
                        throw new IllegalStateException("Document update failed");
                    }
                }
            });
        } catch (IllegalStateException expectedFailure) {
            if (scenario == Scenario.SUCCESS) throw expectedFailure;
        }
        return new Result(db.queryForObject("select state from customer where id = 1", String.class),
                db.queryForObject("select count(*) from document where state = 'pending'", Integer.class),
                db.queryForList("select document_id from failure_history order by document_id", String.class));
    }

    public static void main(String[] args) {
        for (var scenario : Scenario.values()) {
            var expected = switch (scenario) {
                case SUCCESS -> new Result("requested", 2, List.of());
                case SECOND_DOCUMENT -> new Result("active", 0, List.of("B"));
                default -> new Result("active", 0, List.of());
            };
            var observed = run(scenario);
            if (!expected.equals(observed)) throw new AssertionError(scenario + " " + observed);
            System.out.println(scenario + " " + observed);
        }
    }
}
