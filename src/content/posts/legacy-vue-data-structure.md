---
title: "Vue.js에서 v-data-table 데이터 구조 단순화하기"
description: "Vue.js의 v-data-table을 사용하면서 @click:row 이벤트로 전달되는 데이터 구조가 복잡해질 때, 이를 단순화하고 효율적으로 처리하는 방법에 대해 알아보겠습니다."
date: "2025-01-06"
tags: ["vue3","typescript","v-data-table"]
category: "vue"
origin: "hexo"
legacyUrl: "/2025/01/06/vue_data_structure/"
---
<!-- hexo-import:v1 sha256=d6ff9cd5bec5c6da04cd28f21ecd5a8067ecf90ab007651bf87adcb879bee3fd -->

<span id="Vue-js에서-v-data-table-데이터-구조-단순화하기"></span>

![](/legacy-assets/images/thumbnail/vue.png)

Vue.js의 `v-data-table`을 사용하면서 `@click:row` 이벤트로 전달되는 데이터 구조가 복잡해질 때, 이를 단순화하고 효율적으로 처리하는 방법에 대해 알아보겠습니다.

* * *

## 문제 상황

`v-data-table`의 `@click:row` 이벤트는 행 데이터를 클릭할 때 다음과 같이 복잡한 구조를 전달합니다:

```javascript
{
  columns: Proxy(Array),
  index: 3,
  internalItem: Proxy(Object),
  item: Proxy(Object),
  toggleExpand: Function,
  toggleSelect: Function,
}
```

하지만, `NoticeListView.vue`와 같은 다른 컴포넌트에서는 단순히 `BoardItem` 타입 데이터를 필요로 합니다. 이로 인해 데이터 구조를 정리하지 않으면 다음과 같은 문제가 발생합니다:

1.  데이터 구조가 불필요하게 복잡해짐.
2.  타입스크립트에서 타입 오류 발생.
3.  코드 가독성과 유지보수성이 저하됨.

* * *

## 해결 방안

이 문제를 해결하기 위해, **`BoardList.vue`에서 데이터 구조를 단순화**하여 필요한 데이터만 전달하도록 수정합니다.

* * *

<span id="1-BoardList-vue-수정"></span>

### 1\. `BoardList.vue` 수정

`v-data-table`의 `@click:row` 이벤트에서 `row.item`만 추출하여 `emit`으로 전달합니다. 이로써 불필요한 메타데이터를 제거할 수 있습니다.

```typescript
const handleRowClick = (event: MouseEvent, row: { item: BoardItem }) => {
    emit('rowClick', row.item); // 필요한 데이터만 전달
};
```

#### 주요 포인트

-   `row.item`은 클릭된 행의 실제 데이터로, `BoardItem` 타입과 일치합니다.
-   불필요한 메타데이터(`index`, `internalItem` 등\`)를 제거해 구조를 단순화합니다.

* * *

<span id="2-NoticeListView-vue-수정"></span>

### 2\. `NoticeListView.vue` 수정

`BoardList.vue`에서 `emit`으로 단순화된 데이터를 전달하므로, `NoticeListView.vue`는 별도의 데이터 변환 없이 바로 처리할 수 있습니다.

```typescript
const handleRowClick = (row: BoardItem) => {
    router.push(`/operations/notice/details/${row.id}`);
};
```

#### 주요 포인트

-   전달받은 `row`는 `BoardItem` 타입이므로 타입 안정성을 유지합니다.
-   단순히 `row.id`에 접근하여 라우팅 처리를 수행합니다.

* * *

### 3\. 데이터 흐름

1.  **`v-data-table`**: `@click:row` 이벤트에서 복잡한 행 데이터를 전달.
2.  **`BoardList.vue`**: `handleRowClick`에서 `row.item`만 추출하여 `emit`으로 전달.
3.  **`NoticeListView.vue`**: 전달받은 데이터를 `BoardItem` 타입으로 처리.

* * *

## 최종 코드

<span id="BoardList-vue"></span>

### `BoardList.vue`

```typescript
const handleRowClick = (event: MouseEvent, row: { item: BoardItem }) => {
    emit('rowClick', row.item); // 필요한 데이터만 전달
};
```

<span id="NoticeListView-vue"></span>

### `NoticeListView.vue`

```typescript
const handleRowClick = (row: BoardItem) => {
    router.push(`/operations/notice/details/${row.id}`);
};
```

* * *

## 장점

1.  **데이터 구조 단순화**:
    
    -   복잡한 메타데이터를 제거하고 필요한 데이터만 전달합니다.
2.  **타입 안정성 보장**:
    
    -   타입스크립트를 활용해 컴파일 단계에서 타입 오류를 방지합니다.
3.  **유지보수성 향상**:
    
    -   코드 가독성과 구조가 개선되어 유지보수가 용이합니다.
4.  **재사용성 증가**:
    
    -   `NoticeListView.vue`는 단순한 데이터 구조에 의존하므로 다른 컨텍스트에서도 쉽게 재사용 가능합니다.

* * *

## 결론

`v-data-table`의 `@click:row` 이벤트에서 데이터 구조를 단순화하는 것은 Vue.js 프로젝트의 코드 품질과 유지보수성을 크게 향상시킵니다. 위와 같은 방법으로 불필요한 복잡성을 제거하고, 효율적이고 안정적인 데이터 처리를 구현해 보세요.
