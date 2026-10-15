import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const root='src/content/posts/';
const blocks=(id,lang)=>[...readFileSync(root+id+'.md','utf8').matchAll(new RegExp('```'+lang+'\\r?\\n([\\s\\S]*?)```','g'))].map(m=>m[1]);
const tsRun=(source,returnValue)=>new Function('require','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText+';return '+returnValue)(require,{});
const reactive=tsRun(blocks('legacy-vue-component','ts')[0],'{amount,initialLabel,label}');
assert.equal(reactive.initialLabel,'이하');
reactive.amount.value=20;
assert.equal(reactive.initialLabel,'이하');
assert.equal(reactive.label.value,'초과');
const merge=tsRun(blocks('notes-stable-identity-save','ts')[0],'mergeEdits');
const edits=new Map([['A',{rate:'1'}],['B',{rate:'2'}]]);
assert.deepEqual(merge([{id:'B',label:'B'},{id:'A',label:'A'}],edits).map(x=>x.rate),['2','1']);
assert.throws(()=>merge([{id:'A',label:'A'},{id:'A',label:'duplicate'}],edits),/중복/);
assert.throws(()=>merge([{id:'C',label:'missing'}],edits),/찾을/);
const factory=tsRun(blocks('notes-response-ordering','ts')[0],'createLatestLoader');
const pending=[];const applied=[];
const loader=factory(()=>new Promise(resolve=>pending.push(resolve)),value=>applied.push(value));
const first=loader.load('A'); const second=loader.load('A');
pending[1]('new');await second;pending[0]('old');await first;
assert.deepEqual(applied,['new']);
const third=loader.load('A');loader.invalidate();pending[2]('invalid');await third;
assert.deepEqual(applied,['new']);
const dir='.qa/article-examples';mkdirSync(dir,{recursive:true});
const javaFiles=[];
for(const id of ['legacy-getter-and-setter','legacy-simpledateformaterror','legacy-javatrycatch']){
 for(const source of blocks(id,'java')) {
  const name=source.match(/public final class (\w+)/)?.[1];
  if(name){const path=dir+'/'+name+'.java';writeFileSync(path,source);javaFiles.push(path);}
 }
}
writeFileSync(dir+'/ArticleExamplesTest.java',"import java.time.LocalDate;\nimport java.time.format.DateTimeParseException;\nimport java.nio.file.Path;\nimport java.io.IOException;\npublic class ArticleExamplesTest {\n public static void main(String[] args) throws Exception {\n  Wallet wallet = new Wallet(100);\n  wallet.withdraw(30);\n  if(wallet.getBalance()!=70) throw new AssertionError(\"balance\");\n  expect(IllegalArgumentException.class,()->new Wallet(-1));\n  expect(IllegalArgumentException.class,()->wallet.withdraw(0));\n  expect(IllegalArgumentException.class,()->wallet.withdraw(80));\n  if(!Dates.parse(\"20240229\").equals(LocalDate.of(2024,2,29))) throw new AssertionError(\"leap day\");\n  for(String bad:new String[]{\"20230229\",\"20260230\"}) expect(DateTimeParseException.class,()->Dates.parse(bad));\n  for(String bad:new String[]{\"20260101abc\",\"2026-01-01\",\"\"}) expect(IllegalArgumentException.class,()->Dates.parse(bad));\n  expect(IllegalArgumentException.class,()->Dates.parse(null));\n  LegacyDates.parse(\"20240229\");\n  expect(java.text.ParseException.class,()->LegacyDates.parse(\"20230229\"));\n  expect(IOException.class,()->TextFiles.read(Path.of(\".qa/article-examples/does-not-exist.txt\")));\n  System.out.println(\"Java article examples passed: validation, dates, checked exception propagation.\");\n }\n interface Action { void run() throws Exception; }\n static void expect(Class<? extends Throwable> type,Action action) throws Exception {\n  try { action.run(); } catch(Throwable cause) {\n   if(type.isInstance(cause)) return;\n   throw new AssertionError(\"Wrong exception\",cause);\n  }\n  throw new AssertionError(\"Expected \"+type.getName());\n }\n}\n");
assert.equal(javaFiles.length,4,'Four complete Java examples extracted from published articles');
javaFiles.push(dir+'/ArticleExamplesTest.java');
execFileSync('javac',['-encoding','UTF-8','--release','17',...javaFiles],{stdio:'pipe',windowsHide:true});
console.log(execFileSync('java',['-cp',dir,'ArticleExamplesTest'],{encoding:'utf8',windowsHide:true}).trim());
console.log('TypeScript article examples passed: Vue reactivity, stable identity merge, out-of-order responses, invalidation.');
