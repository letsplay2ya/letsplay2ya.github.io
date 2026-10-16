# 문서·코드 불일치 검사 실험
Node.js 24 권장. 외부 npm 패키지 불필요.
```sh
node cli.mjs baseline
node evaluate.mjs
node test.mjs
```
baseline은 모델이 아닌 고정 순서 규칙 검사입니다.
OpenAI 실행 경로:
```sh
node cli.mjs openai
```
OPENAI_API_KEY와 OPENAI_MODEL을 실행 환경에 설정해야 합니다.
명시적으로 openai를 선택할 때만 선택한 예제의 텍스트가 API로 전송됩니다.
키를 브라우저 코드나 저장소에 넣지 않습니다. 사이트에는 모델 API가 연결되지 않습니다.

읽기 전용 도구: 파일 목록 / 파일 읽기 / README 후보 검사 / 근거 있는 보고.
호출 예산: 최대 8턴, 12도구 호출. 파일 100개 / 텍스트 32 KiB 제한.
숨김 파일·심볼릭 링크·node_modules·dist를 읽기 목록에서 제외합니다.
도구 경로는 realpath로 루트 내부인지 확인합니다.
이 예제는 완전한 보안 샌드박스나 일반 코드 분석기가 아닙니다.
동시에 파일을 수정하지 않는 정적 실습 폴더를 사용하세요.
OpenAI 경로는 계약 테스트만 했으며 실제 모델 품질·지연·비용을 측정하지 않았습니다.
