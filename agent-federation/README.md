# 설치 및 사용 안내

기획업무 자동화 AI 에이전트 연합 설정 파일 모음.
**회사 PC 로컬 Claude Code**에서 `D:\LLM WIKI`를 작업 디렉터리로 실행하는 것을 전제로 한다.

수집 → 인사이트 생성 → 집필까지 진행한 뒤, **검증자 3인이 교차 검증하고
집필자가 반박하며 합의에 도달할 때까지 라운드를 반복**하는 구조다.

---

## 1. 파일 배치

```
D:\LLM WIKI\
├── CLAUDE.md                                  ← CLAUDE.md
└── .claude\
    ├── settings.json                          ← settings.json
    ├── scripts\
    │   └── external-verify.mjs                ← scripts\external-verify.mjs
    ├── agents\
    │   ├── wiki-librarian.md                  ← 사서 (내부 근거)
    │   ├── web-scout.md                       ← 정찰 (외부 사실)
    │   ├── insight-analyst.md                 ← 분석 (교차 인사이트)
    │   ├── report-writer.md                   ← 집필 + 지적 응답
    │   ├── auditor-evidence.md                ← 검증 A (근거·수치·금칙)
    │   ├── auditor-logic.md                   ← 검증 B (논증·전제·모순)
    │   └── auditor-external.md                ← 검증 C (이종 모델)
    └── skills\
        └── planning-report\
            └── SKILL.md                       ← 조정자 라운드 프로토콜
```

`00_작업정리서.md`는 설계 문서이므로 배치 대상이 아니다.

## 2. 산출 폴더 생성

```
D:\LLM WIKI\92_outputs\04_reports\
D:\LLM WIKI\92_outputs\05_orchestration\
D:\LLM WIKI\92_outputs\05_orchestration\egress\
```

`01_drafts`는 이미 존재한다.

## 3. 사내 스킬 확인

`/skills`로 `kolon-report`(.docx)와 `kolon-ppt`(.pptx)가 있는지 확인한다. 없으면 산출 단계에서 실패한다.

## 4. 이종 모델 검증자 설정

검증자 C는 외부 LLM을 호출한다. **API 키는 환경변수로 넣는다. `settings.json`에 적지 않는다.**

```powershell
# PowerShell — 사용자 환경변수로 영구 설정 (새 터미널부터 적용)
setx OPENAI_API_KEY "sk-proj-..."
setx EXTERNAL_VERIFIER_MODEL "gpt-4.1"    # 선택. 미설정 시 기본값
```

`setx`는 **현재 창에는 적용되지 않는다.** 설정 후 터미널을 새로 열어야 한다.
지금 창에서 바로 쓰려면 `$env:OPENAI_API_KEY = "sk-proj-..."`를 함께 실행한다.

> **ChatGPT 구독과 API 결제는 별개다.** ChatGPT Plus·Team 구독으로는 API를 호출할 수 없고,
> platform.openai.com에서 별도로 크레딧을 충전해야 한다. 사내 계정을 쓴다면
> 조직(Organization) 소속으로 발급된 키인지 확인할 것.

### 사내 프록시 환경

**Node 내장 `fetch`는 `HTTPS_PROXY`를 자동으로 사용하지 않는다.** 프록시 뒤에서 쓰려면
`undici` 패키지가 있어야 하고, 스크립트가 이를 감지해 적용한다.

```powershell
cd "D:\LLM WIKI"
npm install undici
setx HTTPS_PROXY "http://proxy.사내주소:포트"
```

없으면 스크립트가 경고를 출력하고 연결에 실패한다.

### 설정 확인 — 위키 내용을 전송하지 않는다

```powershell
node .claude\scripts\external-verify.mjs --check
```

키·네트워크·모델 사용 가능 여부만 점검한다. **초안이나 위키 내용을 일절 보내지 않는다.**
키 설정 직후 이것부터 돌린다.

| 결과 | 의미 |
|---|---|
| `✅ 연결 정상` + `✅ 지정 모델 사용 가능` | 준비 완료 |
| `❌ OPENAI_API_KEY 미설정` (코드 3) | 터미널을 새로 열었는지 확인 |
| `❌ 인증 실패 401` (코드 4) | 키가 잘못됐거나 만료 |
| `❌ 인증 실패 429` (코드 4) | 크레딧 잔액 확인 |
| `⚠ 지정 모델이 목록에 없다` | `EXTERNAL_VERIFIER_MODEL` 수정 |
| `❌ 연결 실패` (코드 4) | 프록시 설정·`undici` 설치 확인 |

### 전송 내용을 미리 보려면

```powershell
node .claude\scripts\external-verify.mjs "92_outputs\01_drafts\<초안>.md" --dry-run
```

API를 호출하지 않고 **전송 예정 내용 전량만** `92_outputs\05_orchestration\egress\`에 기록한다.
첫 실사용 전에 한 번 돌려 무엇이 나가는지 눈으로 확인할 것을 권한다.

## 5. 실행

```
cd /d "D:\LLM WIKI"
claude
```

첫 실행 시 `/permissions`로 `10_wiki` 쓰기가 `deny`에 있는지 확인한다.

---

## 6. 첫 파일럿 — LH 모듈러 수주 후속

```
/planning-report

주제: LH 모듈러 공공주택 수주 후속 검토
질문: 8·13 재정지원 이후 우리 수주 전제 중 무엇이 바뀌었고,
      LH 협의에서 무엇을 다르게 물어야 하는가
배포등급: internal
산출: docx
```

### 합격 판정

| 기준 | 필수 |
|---|:--:|
| `WIKI-2026-00112` 동등 이상의 인사이트 1건 이상 | O |
| 미합의(ESCALATED) 0건으로 합의 도달 | O |
| 모든 수치가 SRC까지 역추적 성공 | O |
| 검증자가 틀려서 철회된 지적 1건 이상 (반박 기능 작동 확인) | 우대 |
| 신규 창발 문서 1건 이상 | 우대 |

네 번째 항목이 중요하다. **철회가 한 건도 없다면 반박 기능이 실질적으로 죽어 있는 것**이고,
검증자가 무조건 이기는 구조라면 라운드를 도는 의미가 없다.

---

## 7. 오케스트레이션 동작 방식

```
라운드 1  검증 A·B·C 병렬 (서로의 지적을 보지 않음)
   ↓      → 지적 대장 통합, 중복 병합
라운드 2  지적 대장 전체 공개
   ↓      → 집필자: ACCEPT / REBUT / DEFER
          → 검증자: 다른 검증자 지적에 상호 이의
라운드 3  REBUT 건을 원 발행 검증자에게만 반송
   ↓      → WITHDRAW / HOLD / ARBITRATE
라운드 4  DISPUTED 건 중재 (관여하지 않은 검증자가 판정, 최종)
   ↓
판정      전부 CLOSED → 자동 산출
          ESCALATED 1건 이상 → 중단, 사람에게
```

### 안전장치

| 위험 | 장치 |
|---|---|
| 집필자가 옳은 지적을 "잘못 봤다"고 기각 | **증거 없는 반박은 조정자가 자동 기각.** 지적은 유지되고 라운드만 소모 |
| 검증자가 틀린 지적을 끝까지 고수 | `HOLD`에 추가 증거 의무. 없으면 조정자가 `WITHDRAW` 처리 |
| 무한 왕복 | 최대 4라운드. 초과분은 전부 `ESCALATED` |
| 세 AI가 같은 오류에 합의 | 관점 분리 + 이종 모델. 그래도 남는 위험은 합의 로그로 사후 추적 |
| 검증자끼리 중복 지적 | 조정자가 대장 통합 시 병합 |

**다수결이 아니다.** 증거가 있으면 검증자 셋이 다 틀릴 수 있고, 그때는 셋 다 철회한다.

---

## 8. 권한 설계 요지

**① 승인 위키 오염 방지** — `10_wiki/`, `91_index/`, `00_raw_sources/`, `05_processing_cache/`,
`90_schema/`, `93_inbox/`, `99_legacy/`, `.obsidian/` 쓰기 차단.
AI가 쓸 수 있는 곳은 `92_outputs/`의 세 폴더뿐이다.

**② 외부 반출 통제** — `git init`·`git remote`·`git push`·`gh`·`curl`·`wget`·`scp`·`rsync` 차단.
특히 `git init` 차단이 중요하다 — 위키 폴더를 git 저장소로 만드는 것 자체가
`10_wiki/09_운영_감사/WIKI-2026-00099`에 기록된 반출 사고의 출발점이었다.

**③ 단일 반출 통로** — 유일한 예외는 `.claude/scripts/external-verify.mjs`다.
이 경로만 초안 원문을 외부로 보낼 수 있고, **전송 내용 전량이 egress 로그에 기록**된다.
로그 폴더는 **쓰기 자체가 차단**되어 있어 에이전트가 지우거나 고칠 수 없다.

> **이 구성의 성격** — 사용자 선택에 따라 초안 원문(원가율·사업비·제작사 견적 포함)이
> 외부 API로 전송된다. 기존의 "외부로 내보내지 않는다" 원칙에 대한 의도적 예외이며,
> 대외비 반출 가능 여부는 사내 별도 확인이 필요하다.
> 검증자 C를 쓰지 않으려면 `auditor-external.md`를 삭제하면 된다 — A·B 2인으로 동작한다.

---

## 9. 커스터마이징 지점

| 바꾸고 싶은 것 | 수정할 파일 |
|---|---|
| 라운드 상한·게이트·합의 판정 | `skills/planning-report/SKILL.md` |
| 반박 증거 인정 범위 | `agents/report-writer.md` 「반박 규칙」 |
| 검증 관점 추가·변경 | `agents/auditor-logic.md` L1~L7 |
| 외부 모델·검증 지시문 | `scripts/external-verify.mjs` 상단 `SYSTEM` |
| 인사이트 판정 강도 | `agents/insight-analyst.md` §4 기각 규칙 |
| 교차 규칙 추가 | `agents/insight-analyst.md` §2 |
| 대외비 금칙 항목 | `agents/auditor-evidence.md` 검사 4 |
| 쓰기 허용 경로 | `settings.json` |

에이전트별 모델은 각 파일 frontmatter의 `model:`에서 바꾼다.
현재 `insight-analyst`·`auditor-logic`·`report-writer`가 `opus`, 나머지는 `sonnet`이다.

---

## 10. 알려진 제약

- **원문 미도달 17건** — `.zip`·`.msg` 미지원 형식 등. 검증 A가 "(원문 미도달)" 병기를 강제한다.
- **`06_업무절차_SOP` 비어 있음** — 업무 절차 질의는 근거가 없다.
- **index.md 의존** — 신규 문서를 위키에 추가한 뒤 index를 갱신하지 않으면 사서가 찾지 못한다.
- **검증자 C는 원문 대사를 못 한다** — 위키 파일에 접근하지 않으므로 수치 진위를 판정할 수 없다.
  논증 결함 검출이 그 역할이며, 수치는 검증 A가 담당한다.
- **웹 검색 시 사내 정보 차단은 프롬프트 수준** — `web-scout`에 지시되어 있으나
  사용자가 직접 입력하면 막히지 않는다.
