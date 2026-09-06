#!/usr/bin/env node
/**
 * external-verify.mjs — 이종 모델 검증자 호출
 *
 * 보고서 초안을 외부 LLM(GPT 계열)에 보내 검증 지적을 받아온다.
 * Claude 검증자들과 훈련 분포가 달라 공통 맹점을 깨는 것이 목적이다.
 *
 * ⚠ 이 스크립트는 초안 원문을 외부 API로 전송한다.
 *    전송 내용 전량이 92_outputs/05_orchestration/egress/ 에 기록된다.
 *    로그를 지우지 말 것 — 무엇이 사외로 나갔는지의 유일한 기록이다.
 *
 * 사용:
 *   node .claude/scripts/external-verify.mjs <draft.md 경로> [--dry-run]
 *
 * 환경변수:
 *   OPENAI_API_KEY            (필수) API 키
 *   EXTERNAL_VERIFIER_MODEL   (선택) 기본값 gpt-4.1
 *   EXTERNAL_VERIFIER_BASEURL (선택) 기본값 https://api.openai.com/v1
 *   HTTPS_PROXY               (선택) 사내 프록시
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DRAFT = process.argv[2];
const DRY = process.argv.includes('--dry-run');

if (!DRAFT) {
  console.error('사용법: node external-verify.mjs <draft.md 경로> [--dry-run]');
  process.exit(2);
}
if (!fs.existsSync(DRAFT)) {
  console.error(`초안 파일 없음: ${DRAFT}`);
  process.exit(2);
}

const MODEL   = process.env.EXTERNAL_VERIFIER_MODEL   || 'gpt-4.1';
const BASEURL = process.env.EXTERNAL_VERIFIER_BASEURL || 'https://api.openai.com/v1';
const KEY     = process.env.OPENAI_API_KEY;

const draft = fs.readFileSync(DRAFT, 'utf8');

// ── 검증 지시문 ──────────────────────────────────────────────
const SYSTEM = `너는 건설사 기술연구소의 외부 검증자다.
사내 다른 검증자들과 다른 관점에서 보고서 초안의 결함을 찾는 것이 임무다.

호의적으로 읽지 마라. 틀린 것을 찾는 것이 임무다.
문장을 다듬거나 칭찬하지 마라. 지적만 하라.

## 중점적으로 볼 것

사내 검증자는 근거 추적과 문서 대사를 이미 수행했다.
너는 그들이 놓치기 쉬운 것을 본다.

1. 논증 비약 — 근거와 결론 사이에 빠진 단계가 있는가
2. 숨은 전제 — 저자가 자명하다고 여겨 적지 않은 가정이 있는가
3. 대안 해석 — 같은 근거로 정반대 결론이 가능한가
4. 단위·기준·시점의 혼동 — 서로 다른 기준의 수치를 나란히 비교하고 있는가
5. 과잉 일반화 — 한두 사례에서 일반 법칙을 끌어냈는가
6. 실행 불가 — 제언이 담당·시점·조건 없이 방향만 말하는가
7. 내적 모순 — 앞뒤 장에서 서로 어긋나는 진술이 있는가

## 하지 말 것

- 문체·표현·가독성 지적 (검증 대상이 아니다)
- 원문에 접근할 수 없는 수치의 진위 판정 (너는 원문을 갖고 있지 않다)
- 추가 자료 조사 제안 (지적이 아니라 소망이다)
- 확신할 수 없는 것을 지적으로 올리기 — 확실한 것만

## 출력 형식

JSON 배열만 출력하라. 설명·머리말·코드펜스 없이 배열 그 자체만.
지적할 것이 없으면 빈 배열 [] 을 출력하라.

[
  {
    "id": "F-C01",
    "severity": "BLOCK | FIX | WARN",
    "location": "지적 위치 (장·절·문장)",
    "claim": "무엇이 문제인지 한 문장",
    "evidence": "초안의 어느 문장이 근거인지 인용",
    "proposed_fix": "어떻게 고쳐야 하는지"
  }
]

severity 기준:
- BLOCK: 결론이 성립하지 않는다. 이대로 산출하면 안 된다.
- FIX:   결론은 유지되나 논거·표현에 수정이 필요하다.
- WARN:  기록해 둘 만하나 수정을 강제하지 않는다.`;

const USER = `아래 보고서 초안을 검증하라.\n\n---\n\n${draft}`;

// ── 전송 기록 ────────────────────────────────────────────────
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
const egressDir = path.join('92_outputs', '05_orchestration', 'egress');
fs.mkdirSync(egressDir, { recursive: true });

const payload = {
  model: MODEL,
  messages: [
    { role: 'system', content: SYSTEM },
    { role: 'user',   content: USER },
  ],
  temperature: 0,
};

const record = {
  timestamp: new Date().toISOString(),
  endpoint: `${BASEURL}/chat/completions`,
  model: MODEL,
  draft_path: DRAFT,
  draft_sha256: crypto.createHash('sha256').update(draft).digest('hex'),
  draft_bytes: Buffer.byteLength(draft, 'utf8'),
  sent_verbatim: payload,          // 실제 전송 본문 전량
  dry_run: DRY,
};
const logPath = path.join(egressDir, `${stamp}-external-verify.json`);
fs.writeFileSync(logPath, JSON.stringify(record, null, 2));
console.error(`[egress] 전송 기록: ${logPath}`);

if (DRY) {
  console.error('[dry-run] 전송하지 않고 종료. 위 파일에서 전송 예정 내용을 확인할 것.');
  console.log('[]');
  process.exit(0);
}
if (!KEY) {
  console.error('OPENAI_API_KEY 미설정. --dry-run 으로 전송 내용만 확인하거나 키를 설정할 것.');
  process.exit(3);
}

// ── 호출 ─────────────────────────────────────────────────────
const res = await fetch(`${BASEURL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${KEY}`,
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`API 오류 ${res.status}: ${body.slice(0, 500)}`);
  process.exit(4);
}

const data = await res.json();
const text = data.choices?.[0]?.message?.content ?? '';

// 응답도 함께 기록
record.response_raw = text;
record.usage = data.usage ?? null;
fs.writeFileSync(logPath, JSON.stringify(record, null, 2));

// ── 파싱 ─────────────────────────────────────────────────────
let findings;
try {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  findings = JSON.parse(cleaned);
  if (!Array.isArray(findings)) throw new Error('배열이 아님');
} catch (e) {
  console.error(`응답 파싱 실패 (${e.message}). 원문은 ${logPath} 의 response_raw 참조.`);
  console.log('[]');
  process.exit(5);
}

// id 정규화 — 외부 검증자는 항상 C 계열
findings = findings.map((f, i) => ({
  ...f,
  id: `F-C${String(i + 1).padStart(2, '0')}`,
  source: 'external',
  model: MODEL,
  status: 'OPEN',
}));

console.error(`[external] 지적 ${findings.length}건 (model=${MODEL})`);
console.log(JSON.stringify(findings, null, 2));
