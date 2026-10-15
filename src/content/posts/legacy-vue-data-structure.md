---
title: "테이블의 행 클릭 이벤트를 화면 밖으로 그대로 넘기지 않기"
description: "테이블 라이브러리의 이벤트 객체와 업무 데이터를 분리합니다. 선택 이벤트의 계약을 작게 만들고 라이브러리 변경의 영향을 줄이는 Vue 예제입니다."
date: "2025-01-06"
tags: ["Vue","TypeScript","컴포넌트 설계"]
category: "Vue"
origin: "hexo"
legacyUrl: "/2025/01/06/vue_data_structure/"
updated: "2026-10-15"
---

<span id="Vue-js에서-v-data-table-데이터-구조-단순화하기" aria-hidden="true"></span>
<span id="문제-상황" aria-hidden="true"></span>
<span id="해결-방안" aria-hidden="true"></span>
<span id="1-BoardList-vue-수정" aria-hidden="true"></span>
<span id="1-boardlistvue-수정" aria-hidden="true"></span>
<span id="주요-포인트" aria-hidden="true"></span>
<span id="2-NoticeListView-vue-수정" aria-hidden="true"></span>
<span id="2-noticelistviewvue-수정" aria-hidden="true"></span>
<span id="주요-포인트-1" aria-hidden="true"></span>
<span id="3-데이터-흐름" aria-hidden="true"></span>
<span id="최종-코드" aria-hidden="true"></span>
<span id="BoardList-vue" aria-hidden="true"></span>
<span id="boardlistvue" aria-hidden="true"></span>
<span id="NoticeListView-vue" aria-hidden="true"></span>
<span id="noticelistviewvue" aria-hidden="true"></span>
<span id="장점" aria-hidden="true"></span>
<span id="결론" aria-hidden="true"></span>

게시판 화면에서 행을 누르면 상세 페이지로 이동한다. 이때 부모 컴포넌트가 알아야 할 것은 게시글 식별자다. 테이블의 내부 행 래퍼, 정렬 정보, 마우스 이벤트 전체가 필요한 것은 아니다.

이전 글에서는 `row.item`만 넘기는 방법을 소개했다. 핵심은 특정 속성 이름을 외우는 것이 아니라, 라이브러리 이벤트를 화면에서 사용할 이벤트로 바꾸는 경계를 만드는 것이다.

## 부모가 라이브러리의 구조를 알게 되는 경우

부모가 `row.internalItem.raw.id` 같은 경로를 읽기 시작하면 테이블 라이브러리 변경이 라우팅 코드까지 전파된다. 반대로 목록 컴포넌트가 필요한 값만 골라 내보내면 부모는 테이블 구현을 몰라도 된다.

다음은 Vue 3에서 사용하는 축약 예제다. `TableRowPayload`는 설치된 테이블 버전에서 원본 데이터를 `item`으로 전달한다고 확인한 경우의 타입이다. 모든 Vuetify 버전의 공식 이벤트 타입을 대신하지 않는다.

```ts
type BoardItem = {
    id: string;
    title: string;
};

type TableRowPayload = {
    item: BoardItem;
};

const emit = defineEmits<{
    (event: 'open', id: string): void;
}>();

function onTableRowClick(_event: MouseEvent, row: TableRowPayload) {
    emit('open', row.item.id);
}
```

이 코드는 `<script setup lang="ts">` 안에서 사용한다. 테이블 템플릿에서는 행 클릭 이벤트를 이 함수에 연결한다. 실제 라이브러리의 두 번째 인자가 `item`인지 다른 형태인지는 lockfile의 버전과 해당 타입 선언에서 확인해야 한다.

## 이벤트는 받는 쪽의 목적에 맞추기

```ts
function openNotice(id: string) {
    router.push('/operations/notice/details/' + encodeURIComponent(id));
}
```

부모가 이동만 한다면 식별자로 충분하다. 미리보기까지 필요하다면 `{ id, title }` 같은 명시적인 객체를 보낼 수도 있다. 무조건 모든 데이터를 제거하는 것이 목표는 아니다. 공개 이벤트에 어떤 값을 보장할지 정하는 것이 목표다.

## as 단언은 데이터 변환이 아니다

`payload as BoardItem`은 중첩 구조를 평탄화하지 않는다. 서버 응답처럼 런타임에서 들어오는 값이라면 식별자 형식도 검증해야 한다. 컴포넌트 간 타입 계약과 외부 데이터 검증은 서로 다른 경계다.

## 행 안의 버튼과 클릭 충돌

행 안에 삭제 버튼이 있으면 클릭이 행으로 전파되어 상세 화면까지 열릴 수 있다. 해당 버튼에서 `@click.stop`처럼 전파를 제어할지 결정한다. 행 클릭만 제공하면 키보드로 접근하기 어려울 수 있으므로, 제목에 실제 링크를 두는 방법도 검토한다.

수정 후에는 행 클릭 한 번에 open 이벤트가 한 번 발생하는지, 삭제 버튼이 상세 이동을 일으키지 않는지, 정렬 후에도 화면 인덱스가 아닌 원래 식별자가 전달되는지 확인한다.

참고: [Vue 컴포넌트 이벤트](https://vuejs.org/guide/components/events.html), [Vuetify 데이터 테이블 API](https://vuetifyjs.com/en/api/v-data-table/).

