---
title: "Vue 3 + TypeScript 분기처리 정리"
description: "Vue 3와 TypeScript를 함께 사용하면서, 컴포넌트 분기처리를 좀 더 체계적으로 관리하고 싶다면 어떻게 하면 좋을까요?주로 UI 분기처리와 로직 분기처리가 어떻게 다른지, 그리고 이를 TypeScript 타입과 결합했을 때 얻을 수 있는 장점을 살펴보겠습니다."
date: "2025-01-03"
tags: ["vue3","typescript","분기처리","컴포넌트"]
category: "vue"
origin: "hexo"
legacyUrl: "/2025/01/03/vue_component/"
---
<!-- hexo-import:v1 sha256=ce2813eddd7ddcaa318bea80a585be9373cd2c6c34443cc4cb9d676901030653 -->

<span id="Vue-3-TypeScript-분기처리-정리"></span>

![](/legacy-assets/images/thumbnail/vue.png)

Vue 3와 TypeScript를 함께 사용하면서, 컴포넌트 분기처리를 좀 더 체계적으로 관리하고 싶다면 어떻게 하면 좋을까요?  
주로 **UI 분기처리**와 **로직 분기처리**가 어떻게 다른지, 그리고 이를 **TypeScript** 타입과 결합했을 때 얻을 수 있는 장점을 살펴보겠습니다.

* * *

## 목차

1.  [템플릿 단에서의 분기 처리 (v-if, v-else-if, v-else)](#1-%ED%85%9C%ED%94%8C%EB%A6%BF-%EB%8B%A8%EC%97%90%EC%84%9C%EC%9D%98-%EB%B6%84%EA%B8%B0-%EC%B2%98%EB%A6%AC)
2.  [스크립트 단에서의 분기 처리 (if-else, switch, computed)](#2-%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EB%8B%A8%EC%97%90%EC%84%9C%EC%9D%98-%EB%B6%84%EA%B8%B0-%EC%B2%98%EB%A6%AC)
    -   [2-1. `<script setup>`과 if-else / switch 문](#2-1-script-setup%EA%B3%BC-if-else--switch-%EB%AC%B8)
    -   [2-2. `defineComponent` 사용 시](#2-2-defineComponent-%EC%82%AC%EC%9A%A9-%EC%8B%9C)
3.  [컴포넌트 구조/상태/Props 등을 통한 분기 처리](#3-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EA%B5%AC%EC%A1%B0%EC%83%81%ED%83%9Cprops-%EB%93%B1%EC%9D%84-%ED%86%B5%ED%95%9C-%EB%B6%84%EA%B8%B0-%EC%B2%98%EB%A6%AC)
    -   [3-1. Props 타입에 따른 분기](#3-1-Props-%ED%83%80%EC%9E%85%EC%97%90-%EB%94%B0%EB%A5%B8-%EB%B6%84%EA%B8%B0)
    -   [3-2. Computed / Watch를 통한 분기 처리](#3-2-computed--watch%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%B6%84%EA%B8%B0-%EC%B2%98%EB%A6%AC)
4.  [TypeScript와 함께 사용할 때의 팁 (유니언 타입, enum, 인터페이스 등)](#4-TypeScript%EC%99%80-%ED%95%A8%EA%BB%98-%EC%82%AC%EC%9A%A9%ED%95%A0-%EB%95%8C%EC%9D%98-%ED%8C%81-%EC%9C%A0%EB%8B%88%EC%96%B8-%ED%83%80%EC%9E%85-enum-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4-%EB%93%B1)
    -   [4-1. 유니언 타입 / enum 적극 활용](#4-1-%EC%9C%A0%EB%8B%88%EC%96%B8-%ED%83%80%EC%9E%85--enum-%EC%A0%81%EA%B7%B9-%ED%99%9C%EC%9A%A9)
    -   [4-2. 인터페이스로 분기 처리](#4-2-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4%EB%A1%9C-%EB%B6%84%EA%B8%B0-%EC%B2%98%EB%A6%AC)
    -   [4-3. 안전한 옵셔널 체이닝 및 null 병합](#4-3-%EC%95%88%EC%A0%84%ED%95%9C-%EC%98%B5%EC%85%94%EB%84%90-%EC%B2%B4%EC%9D%B4%EB%8B%9D-%EB%B0%8F-null-%EB%B3%91%ED%95%A9)
5.  [정리](#5-%EC%A0%95%EB%A6%AC)

* * *

## 1\. 템플릿 단에서의 분기 처리

Vue에서 가장 직관적인 분기 처리는 템플릿에서 `v-if`, `v-else-if`, `v-else`를 활용하는 방법입니다.

```plaintext
<template>
  <div>
    <h1>분기 처리 예시</h1>
    <div v-if="status === 'loading'">
      로딩 중...
    </div>
    <div v-else-if="status === 'error'">
      에러 발생!
    </div>
    <div v-else>
      데이터: {{ data }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// status를 'loading', 'success', 'error'로 관리
const status = ref<'loading' | 'success' | 'error'>('loading')
const data = ref<string>('')

setTimeout(() => {
  // API 호출 후 로딩이 끝났다고 가정
  status.value = 'success'
  data.value = 'API에서 받아온 데이터'
}, 2000)
</script>
```

-   `ref<'loading' | 'success' | 'error'>('loading')` 형태로 **유니언 타입**을 선언하면, 잘못된 상태가 들어오는 일을 예방할 수 있습니다.
-   단순 분기라면 템플릿에 직접 `v-if`를 써도 무방하지만, 복잡한 로직은 `computed`나 메서드로 옮기는 것이 유지보수에 유리합니다.

* * *

## 2\. 스크립트 단에서의 분기 처리

Vue 3의 `<script setup>` 또는 `defineComponent` 구문 내부에서, **TypeScript**를 활용해 로직 분기를 보다 안전하게 관리할 수 있습니다.

* * *

<span id="2-1-lt-script-setup-gt-과-if-else-x2F-switch-문"></span>

### 2-1. `<script setup>`과 if-else / switch 문

```plaintext
<template>
  <div>
    <h2>결과: {{ result }}</h2>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const inputValue = ref<number>(10)

// 간단 분기는 IIFE나 computed로 처리 가능
const result = (() => {
  if (inputValue.value > 10) {
    return '크다'
  } else if (inputValue.value < 10) {
    return '작다'
  } else {
    return '같다'
  }
})()
</script>
```

-   즉시실행함수(**IIFE**)를 사용하거나 `computed`를 사용해 간단히 분기할 수 있습니다.
-   **switch**문을 쓸 수도 있지만, Vue 특성상 `if-else`가 더 자주 사용됩니다.

<span id="2-2-defineComponent-사용-시"></span>

### 2-2. `defineComponent` 사용 시

```ts
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ExampleComponent',
  setup() {
    const count = ref<number>(0)

    function increment() {
      count.value++
    }

    function getStatus() {
      if (count.value > 5) return 'high'
      if (count.value < 0) return 'negative'
      return 'normal'
    }

    return {
      count,
      increment,
      getStatus
    }
  }
})
```

-   템플릿에서는 `getStatus()` 값을 활용해 분기를 나누고, **TypeScript** 타입으로 `count`를 관리할 수 있어 **안전**합니다.

* * *

<span id="3-컴포넌트-구조-x2F-상태-x2F-Props-등을-통한-분기-처리"></span>

## 3\. 컴포넌트 구조/상태/Props 등을 통한 분기 처리

<span id="3-1-Props-타입에-따른-분기"></span>

### 3-1. Props 타입에 따른 분기

컴포넌트에서 `props`를 통해 값(`variant`, `type`, `role` 등)을 전달받으면, 그에 따라 스타일이나 기능을 분기할 수 있습니다.

```plaintext
<template>
  <button
    :class="buttonClass"
    @click="onClick"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, PropType, computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const props = defineProps<{
  variant: ButtonVariant
  label: string
}>()

const emits = defineEmits<{
  (e: 'click'): void
}>()

function onClick() {
  emits('click')
}

const buttonClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'btn-primary'
    case 'secondary':
      return 'btn-secondary'
    case 'danger':
      return 'btn-danger'
  }
})
</script>

<style scoped>
.btn-primary {
  color: #fff;
  background-color: blue;
}
.btn-secondary {
  color: #333;
  background-color: #eee;
}
.btn-danger {
  color: #fff;
  background-color: red;
}
</style>
```

-   `ButtonVariant` 유니언 타입을 활용해, props로 전달되는 값을 엄격히 제한할 수 있습니다.
-   `computed` 내에서 `switch`문으로 분기하면, 템플릿은 더욱 깔끔해집니다.

* * *

<span id="3-2-Computed-x2F-Watch를-통한-분기-처리"></span>

### 3-2. Computed / Watch를 통한 분기 처리

상태가 변할 때 특정 로직을 실행하거나, 값을 미리 계산해둘 수 있습니다.

```ts
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  setup() {
    const count = ref<number>(0)

    watch(count, (newVal) => {
      if (newVal > 10) {
        console.log('10을 초과!')
      }
    })

    return { count }
  }
})
```

-   `count`가 변경될 때마다 `watch` 콜백이 실행되며, 조건에 따라 로직을 분기할 수 있습니다.
-   로직이 복잡하면 메서드로 분리하면 가독성이 좋아집니다.

* * *

<span id="4-TypeScript와-함께-사용할-때의-팁-유니언-타입-enum-인터페이스-등"></span>

## 4\. TypeScript와 함께 사용할 때의 팁 (유니언 타입, enum, 인터페이스 등)

<span id="4-1-유니언-타입-x2F-enum-적극-활용"></span>

### 4-1. 유니언 타입 / enum 적극 활용

```ts
type Status = 'loading' | 'success' | 'error'

function handleStatus(status: Status) {
  switch (status) {
    case 'loading':
      console.log('로딩 중...')
      break
    case 'success':
      console.log('성공!')
      break
    case 'error':
      console.log('에러 발생!')
      break
  }
}
```

-   `Status`를 유니언 타입으로 선언하여, 다른 문자열이 들어올 여지를 사전에 차단할 수 있습니다.
-   컴파일 단계에서 타입 에러를 발생시켜, 런타임 문제를 줄일 수 있습니다.

* * *

### 4-2. 인터페이스로 분기 처리

복잡한 데이터 구조라면, 인터페이스로 객체를 정의한 뒤 필드 값에 따라 분기할 수 있습니다.

```ts
interface User {
  id: number
  name: string
  type: 'admin' | 'common'
}

function getUserRole(user: User) {
  if (user.type === 'admin') return '관리자'
  return '일반 유저'
}
```

-   `user.type`이 `'admin'`이나 `'common'` 중 하나만 되도록 보장되므로, 분기 처리가 명확합니다.

* * *

### 4-3. 안전한 옵셔널 체이닝 및 null 병합

백엔드로부터 받은 데이터가 null/undefined일 수 있다면, 옵셔널 체이닝(`?.`)이나 null 병합(`??`)을 사용해 에러를 피할 수 있습니다.

```plaintext
<template>
  <div>
    <p>사용자 이름: {{ user?.name ?? '이름 없음' }}</p>
  </div>
</template>

<script setup lang="ts">
interface User {
  id: number
  name: string
}

const user: User | null = null // 아직 로딩 전 가정
</script>
```

-   `user?.name` : `user`가 null이면 에러 없이 undefined를 반환
-   `?? '이름 없음'` : null/undefined일 때 `'이름 없음'`을 대신 사용

* * *

## 5\. 정리

1.  **템플릿 분기 처리**: `v-if`, `v-else-if`, `v-else`로 **UI 조건**을 바로 나눌 수 있음
2.  **스크립트 분기 처리**: `<script setup>`나 `defineComponent` 내부에서 **if-else, switch, computed** 등으로 로직을 분기
3.  **Props/State/Computed/Watch**: 컴포넌트 구조나 상태, 프롭스가 변할 때 적절히 로직 분기를 배치
4.  **TypeScript 활용**:
    -   유니언 타입, enum, 인터페이스로 “**올바른 값만**” 들어오도록 강제 → **런타임 에러** 감소
    -   옵셔널 체이닝(`?.`)·null 병합(`??`) 등을 사용해 null/undefined 안전 처리

Vue 3 + TypeScript로 분기처리를 설계할 때는,  
**“템플릿은 간단하게, 로직은 스크립트에서 명확하게”**  
라는 원칙을 지키면 유지보수에 많은 도움이 됩니다.  
TypeScript 타입 시스템을 적극 활용해, 컴파일 단계에서 에러를 미리 발견하고 더욱 **견고한 코드**를 작성해보세요!
