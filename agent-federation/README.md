# 설치 및 사용 안내

기획업무 자동화 AI 에이전트 연합 설정 파일 모음.
**회사 PC 로컬 Claude Code**에서 `D:\LLM WIKI`를 작업 디렉터리로 실행하는 것을 전제로 한다.

---

## 1. 파일 배치

이 폴더의 파일을 아래 위치로 복사한다.

```
D:\LLM WIKI\
├── CLAUDE.md                                  ← CLAUDE.md
└── .claude\
    ├── settings.json                          ← settings.json
    ├── agents\
    │   ├── wiki-librarian.md                  ← agents\wiki-librarian.md
    │   ├── web-scout.md                       ← agents\web-scout.md
    │   ├── insight-analyst.md                 ← agents\insight-analyst.md
    │   ├── report-writer.md                   ← agents\report-writer.md
    │   └── evidence-auditor.md                ← agents\evidence-auditor.md
    └── skills\
        └── planning-report\
            └── SKILL.md                       ← skills\planning-report\SKILL.md
```

`00_작업정리서.md`는 설계 문서이므로 배치 대상이 아니다. 참고용으로 보관한다.

## 2. 산출 폴더 생성

```
D:\LLM WIKI\92_outputs\04_reports\
```

`01_drafts`는 이미 존재한다. `04_reports`만 새로 만든다.

## 3. 사내 스킬 확인

산출 단계는 기존 사내 스킬을 호출한다. 다음이 설치되어 있어야 한다.

- `kolon-report` — .docx 생성
- `kolon-ppt` — .pptx 생성

`/skills` 명령으로 목록에 있는지 확인한다. 없으면 산출 단계에서 실패한다.

## 4. 실행

```
cd /d "D:\LLM WIKI"
claude
```

첫 실행 시 `/permissions`로 권한이 의도대로 걸렸는지 확인한다.
`10_wiki` 쓰기가 `deny`에 있어야 한다.

---

## 5. 첫 파일럿 — LH 모듈러 수주 후속

아래를 그대로 입력한다.

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
| `WIKI-2026-00112`와 동등 이상의 인사이트 1건 이상 재현 | O |
| 검증 `BLOCK` 0건 | O |
| 모든 수치가 SRC까지 역추적 성공 | O |
| 사람이 아직 만들지 않은 신규 창발 문서 1건 이상 | 우대 |

### 인사이트 0건이 나오면

시스템 실패가 아니라 **조정 신호**다. 순서대로 점검한다.

1. `insight-analyst`의 기각 규칙(R1~R6)이 과도한가 → 임계 완화
2. `wiki-librarian`이 가져온 근거 카드의 폭이 좁은가 → 인접 노드 확장 강화
3. 정말 교차점이 없는가 → 주제 재설정

분석가의 0건 보고서에 "시도한 교차 쌍 수"와 "기각 사유 분포"가 나오므로
어느 쪽인지 바로 구분된다.

---

## 6. 권한 설계 요지

`settings.json`은 두 가지를 물리적으로 막는다.

**① 승인 위키 오염 방지**

`10_wiki/`, `91_index/`, `00_raw_sources/`, `05_processing_cache/`, `90_schema/`,
`93_inbox/`, `99_legacy/`, `.obsidian/` 쓰기를 모두 `deny`했다.
AI가 쓸 수 있는 곳은 `92_outputs/01_drafts/`와 `92_outputs/04_reports/` 뿐이다.

**② 외부 반출 방지**

`git init` · `git remote` · `git push` · `gh` · `curl` · `scp` · `rsync`를 `deny`했다.

위키 자료의 외부 저장소 반출 사고 기록이 `10_wiki/09_운영_감사/WIKI-2026-00099`에 있으며,
그 직접 원인이 이 계열의 명령이다. 특히 `git init` 차단이 중요하다 — 위키 폴더를
git 저장소로 만드는 것 자체가 사고의 출발점이었다.

> 해당 기록에는 이 시스템 도입과 별개로 처리가 필요한 미결 항목이 남아 있다.
> 원문을 확인할 것.

---

## 7. 커스터마이징 지점

| 바꾸고 싶은 것 | 수정할 파일 |
|---|---|
| 인사이트 판정을 느슨/엄격하게 | `agents/insight-analyst.md` §4 기각 규칙 |
| 교차 규칙 추가 | `agents/insight-analyst.md` §2 |
| 보고서 목차 구조 | `agents/report-writer.md` 본문 구조 |
| 대외비 금칙 항목 | `agents/evidence-auditor.md` 검사 4 |
| 쓰기 허용 경로 | `settings.json` `permissions.allow` |
| 단계 순서·게이트 | `skills/planning-report/SKILL.md` |
| 위키 구조가 바뀌었을 때 | `CLAUDE.md` §1 폴더 지도 |

에이전트별 모델은 각 파일 frontmatter의 `model:`에서 바꾼다.
현재 `insight-analyst`와 `report-writer`만 `opus`, 나머지는 `sonnet`이다.

---

## 8. 알려진 제약

- **원문 미도달 17건** — `.zip`·`.msg` 미지원 형식 등. 해당 SRC는 원문 대사가 불가하며
  검증 단계에서 "(원문 미도달)" 병기를 강제한다.
- **`06_업무절차_SOP` 비어 있음** — 업무 절차 관련 질의는 근거가 없다.
- **index.md 의존** — 탐색이 `91_index/index.md`의 정확성에 의존한다.
  신규 문서를 위키에 추가한 뒤 index를 갱신하지 않으면 사서가 찾지 못한다.
- **웹 검색 시 사내 정보 차단** — `web-scout`는 원가·견적 등을 검색어에 넣지 않도록
  지시되어 있으나, 프롬프트 수준의 통제이므로 사용자가 직접 입력하면 막히지 않는다.
