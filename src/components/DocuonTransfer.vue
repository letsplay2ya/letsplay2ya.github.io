<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

type Decision = 'approve' | 'reject';
type Status = 'ready' | 'pending' | 'approved' | 'rejected';
const screen = ref<'portal' | 'admin'>('portal');
const status = ref<Status>('ready');
const destination = ref('제2 보관소');
const requestReason = ref('다음 분기 기록을 한 보관소에서 관리합니다.');
const decisionReason = ref('');
const recordedReason = ref('');
const decision = ref<Decision>('approve');
const confirming = ref(false);
const dialog = ref<HTMLDialogElement>();
const reasonInput = ref<HTMLTextAreaElement>();
const confirmButton = ref<HTMLButtonElement>();
const formHeading = ref<HTMLHeadingElement>();
const labels: Record<Status, string> = {
  ready: '신청 전', pending: '접수', approved: '승인', rejected: '반려',
};
const documentState = computed(() =>
  status.value === 'pending' || status.value === 'approved' ? '이관 처리 중' : '이용 가능'
);
const decisionLabel = computed(() => decision.value === 'approve' ? '승인' : '반려');
const bytes = computed(() => new TextEncoder().encode(decisionReason.value).length);
const valid = computed(() => bytes.value > 0 && bytes.value <= 255);

function submitRequest() {
  if (status.value === 'ready') status.value = 'pending';
}

async function openDecision(choice: Decision) {
  if (status.value !== 'pending') return;
  decision.value = choice;
  decisionReason.value = '';
  confirming.value = false;
  dialog.value?.showModal();
  await nextTick();
  reasonInput.value?.focus();
}

async function reviewDecision() {
  if (!valid.value) return;
  confirming.value = true;
  await nextTick();
  confirmButton.value?.focus();
}

async function recordDecision() {
  if (status.value !== 'pending' || !confirming.value || !valid.value) return;
  recordedReason.value = decisionReason.value;
  status.value = decision.value === 'approve' ? 'approved' : 'rejected';
  dialog.value?.close();
  await nextTick();
  formHeading.value?.focus();
}

function reset() {
  status.value = 'ready';
  screen.value = 'portal';
  destination.value = '제2 보관소';
  requestReason.value = '다음 분기 기록을 한 보관소에서 관리합니다.';
  recordedReason.value = '';
}
</script>

<template>
  <section id="transfer-demo" class="transfer" aria-labelledby="transfer-title">
    <header class="intro">
      <h2 id="transfer-title">문서 한 건을 이관해 보기</h2>
      <p>포털에서 이관을 신청한 뒤 관리자 화면에서 승인하거나 반려해 보세요. 가상 문서로 재구성한 Vue 예제입니다.</p>
    </header>

    <div class="console">
      <div class="switcher" role="group" aria-label="이관 예제 화면">
        <button type="button" :aria-pressed="screen === 'portal'" @click="screen = 'portal'">사용자 포털</button>
        <button type="button" :aria-pressed="screen === 'admin'" @click="screen = 'admin'">관리자 화면</button>
      </div>

      <div class="work-area">
        <div class="form-area">
          <h3 ref="formHeading" tabindex="-1">{{ screen === 'portal' ? '문서 이관 신청' : '이관 승인 상세' }}</h3>
          <div v-if="screen === 'admin' && status === 'ready'" class="empty">
            <p>접수된 신청이 없습니다.</p>
            <button type="button" class="secondary" @click="screen = 'portal'">포털에서 신청하기</button>
          </div>

          <template v-else>
            <dl class="fields">
              <div><dt>문서 제목</dt><dd>11월 장비 점검 기록</dd></div>
              <div><dt>수관 보관소</dt><dd>
                <select v-if="screen === 'portal' && status === 'ready'" v-model="destination" aria-label="수관 보관소">
                  <option>제2 보관소</option><option>제3 보관소</option>
                </select><span v-else>{{ destination }}</span>
              </dd></div>
              <div><dt>신청 사유</dt><dd>
                <textarea v-if="screen === 'portal' && status === 'ready'" v-model="requestReason" rows="2" aria-label="신청 사유"></textarea>
                <span v-else>{{ requestReason || '미기재' }}</span>
              </dd></div>
              <div v-if="screen === 'admin'"><dt>대상 문서</dt><dd>1건 · 첨부 파일 2개</dd></div>
              <div v-if="recordedReason"><dt>처리 사유</dt><dd>{{ recordedReason }}</dd></div>
            </dl>
            <div class="actions">
              <button v-if="screen === 'portal' && status === 'ready'" type="button" class="primary" @click="submitRequest">이관 신청</button>
              <button v-else-if="screen === 'portal'" type="button" class="secondary" @click="screen = 'admin'">신청 상세 보기</button>
              <template v-else>
                <button type="button" class="secondary" :disabled="status !== 'pending'" @click="openDecision('reject')">반려</button>
                <button type="button" class="primary" :disabled="status !== 'pending'" @click="openDecision('approve')">승인</button>
              </template>
            </div>
          </template>
        </div>

        <aside class="summary" aria-label="신청과 문서 상태" aria-live="polite">
          <h4>처리 현황</h4>
          <dl>
            <div><dt>신청 상태</dt><dd><span class="state">{{ labels[status] }}</span></dd></div>
            <div><dt>문서 상태</dt><dd>{{ documentState }}</dd></div>
          </dl>
          <p v-if="status === 'pending'">관리자가 심사할 신청이 한 건 생겼습니다.</p>
          <p v-else-if="status === 'approved'">심사 결과를 기록했습니다. 파일 도착 여부는 이 승인으로 확인할 수 없습니다.</p>
          <p v-else-if="status === 'rejected'">신청에는 반려 사유가 남고 문서는 다시 이용할 수 있습니다.</p>
          <p v-else>본문과 별지가 같은 문서에 속합니다. 두 파일을 한 번에 신청합니다.</p>
          <button v-if="status !== 'ready'" class="restart" type="button" @click="reset">처음부터 다시 보기</button>
        </aside>
      </div>
    </div>

    <dialog ref="dialog" aria-labelledby="decision-title">
      <h3 id="decision-title">{{ confirming ? '이 결정으로 처리할까요?' : '문서 이관 ' + decisionLabel }}</h3>
      <template v-if="!confirming">
        <label for="transfer-decision-reason">처리 사유</label>
        <textarea id="transfer-decision-reason" ref="reasonInput" v-model="decisionReason" rows="3" aria-describedby="reason-bytes"></textarea>
        <p id="reason-bytes" :class="{ excessive: bytes > 255 }">{{ bytes }} / 255바이트{{ bytes > 255 ? ' · 입력 한도 초과' : '' }}</p>
      </template>
      <template v-else>
        <p class="decision-copy">11월 장비 점검 기록 · {{ decisionLabel }}</p>
        <blockquote>{{ decisionReason }}</blockquote>
      </template>
      <div class="actions">
        <button class="secondary" type="button" @click="dialog?.close()">취소</button>
        <button v-if="!confirming" class="primary" type="button" :disabled="!valid" @click="reviewDecision">입력 내용 확인</button>
        <button v-else ref="confirmButton" class="primary" type="button" @click="recordDecision">{{ decisionLabel }} 확정</button>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.transfer { margin: 2.75rem 0 4rem; scroll-margin-top: 7rem; }
.intro h2 { margin-bottom: .45rem; }
.intro p { color: var(--muted); margin-bottom: 1.1rem; }
.console { border: 1px solid #bfcbd7; border-radius: 12px; background: #fff; overflow: hidden; color: #213748; }
.switcher { display: flex; gap: .4rem; padding: .7rem 1rem; background: #eaf0f6; border-bottom: 1px solid #ced8e2; }
.switcher button, .actions button, .secondary { border: 1px solid transparent; border-radius: 5px; padding: .4rem .9rem; font-weight: 650; }
.switcher button { background: transparent; color: #3a5369; }
.switcher button[aria-pressed="true"], .primary { background: #224968; color: white; }
.work-area { display: grid; grid-template-columns: minmax(0, 1fr) minmax(230px, 30%); }
.form-area, .summary { padding: clamp(1.1rem, 3.5vw, 2.3rem); }
.form-area h3 { font-size: 1.35rem; margin-bottom: 1rem; }
.fields, .summary dl { margin: 0; }
.fields > div, .summary dl > div { display: grid; grid-template-columns: 6.2rem minmax(0, 1fr); gap: .65rem; align-items: start; padding: .75rem 0; border-top: 1px solid #dce3e9; }
.fields dt, .summary dt { color: #52677a; font-size: .9rem; }
.fields dd, .summary dd { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
.transfer select, .transfer textarea { display: block; width: 100%; min-width: 0; padding: .4rem .6rem; border: 1px solid #aebdc8; border-radius: 4px; background: white; color: #20384a; }
.transfer textarea { resize: vertical; }
.actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
.actions .secondary, .secondary { border: 1px solid #acbdca; background: white; color: #263f53; }
.actions button:disabled { opacity: .45; cursor: default; }
.summary { background: #f3f6f8; border-left: 1px solid #dce3e9; }
.summary h4 { margin: 0 0 1rem; font-size: 1.05rem; }
.summary dl > div { grid-template-columns: 1fr auto; }
.summary dd { font-weight: 650; }
.state { background: #dee9f2; border-radius: 4px; padding: .15rem .45rem; }
.summary p, #reason-bytes { color: #52677a; font-size: .88rem; }
.summary p { margin: .8rem 0; }
.restart { padding: .2rem 0; border: 0; border-bottom: 1px solid; background: transparent; font-size: .86rem; }
.empty { padding-block: 1rem; }
dialog { width: min(28rem, calc(100% - 2rem)); border: 1px solid #a9bccb; border-radius: 10px; padding: 1.6rem; color: #213748; max-height: 85vh; }
dialog::backdrop { background: #14293980; }
dialog h3 { margin-bottom: 1rem; }
dialog label { display: block; margin-bottom: .35rem; }
#reason-bytes { margin: .3rem 0; text-align: right; }
#reason-bytes.excessive { color: #a33721; }
dialog blockquote { margin: .5rem 0 1rem; border-left: 3px solid #b4c9da; padding-left: .8rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.decision-copy { color: #52677a; }
@media (max-width: 720px) {
  .work-area { grid-template-columns: minmax(0, 1fr); }
  .summary { border-left: 0; border-top: 1px solid #dce3e9; }
  .fields > div { grid-template-columns: 5.4rem minmax(0, 1fr); }
}
</style>
