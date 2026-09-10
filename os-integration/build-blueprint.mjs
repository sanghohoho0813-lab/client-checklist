/**
 * 체크리스트 문항 → 미래AI랩 OS 설문 블루프린트 변환기
 *
 * 실행:  node os-integration/build-blueprint.mjs
 * 결과:  os-integration/blueprint.json  (사람이 확인용)
 *        os-integration/install.sql     (Supabase SQL 편집기에 붙여넣을 파일)
 *
 * 문항을 고친 뒤 이 스크립트를 다시 돌리고 install.sql 을 한 번 더 실행하면
 * OS 쪽 블루프린트가 최신 문항으로 갱신됩니다.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* 체크리스트 항목 → OS 질문 분류(QuestionCategory) */
const CATEGORY = {
  '01': 'company', '02': 'waste', '03': 'workflow', '04': 'website', '05': 'ai_fit',
  '06': 'adoption', '07': 'adoption', '08': 'data', '09': 'compliance',
  A: 'systems', B: 'compliance', C: 'ai_fit', D: 'kpi',
  P1: 'adoption', P2: 'workflow', P3: 'compliance', P4: 'compliance',
  P5: 'ai_fit', P6: 'data', P7: 'kpi',
}
const TYPE = { text: 'short_text', long: 'long_text', single: 'single_choice', multi: 'multiple_choice', confirm: 'yes_no' }

const YES_NO = [
  { label: '확인함', value: 'true' },
  { label: '확인하지 않음', value: 'false' },
]

function placement(q, sectionNum, index, required, help) {
  const [type, key, label, data] = q
  const h = help[key] || []
  const raw = type === 'confirm' ? YES_NO : Array.isArray(data) ? data.map((o) => ({ label: o, value: o })) : []
  return {
    id: `${key}__p`,
    questionId: key,          // ← 체크리스트가 보내는 answers[].questionId 와 반드시 같아야 함
    questionCode: key,
    questionText: label,
    helpText: [h[0], h[2]].filter(Boolean).join(' · '),
    example: h[1] || (type === 'text' || type === 'long' ? String(data || '') : ''),
    type: TYPE[type] || 'short_text',
    category: CATEGORY[sectionNum] || 'company',
    scope: 'custom',
    scoringDomain: 'none',
    expertRiskGrade: 'green',
    options: raw.map((o, i) => ({
      id: `${key}__o${i}`, label: o.label, value: o.value, score: 0, riskSignal: 'none', orderIndex: i,
    })),
    repeatTableColumns: [],
    required,
    condition: null,
    sourceScope: 'custom',
    orderIndex: index,
  }
}

/* 체크리스트 맨 아래 자유 서술 칸 (블루프린트에도 문항으로 넣어야 상세화면에 보인다) */
function freeNoteSection(orderIndex) {
  return {
    id: 'sec_free',
    title: '추가 의견',
    description: '체크리스트 맨 아래 자유롭게 적어주신 내용입니다.',
    orderIndex,
    placements: [{
      id: '__freeNote__p',
      questionId: '__freeNote',
      questionCode: '__freeNote',
      questionText: '추가로 전달하고 싶은 내용',
      helpText: '체크만으로 담기 어려운 요청을 자유롭게 적는 칸입니다.',
      example: '예: 현장 직원이 스마트폰으로 최대한 간단하게 쓰게 해주세요.',
      type: 'long_text',
      category: 'company',
      scope: 'custom',
      scoringDomain: 'none',
      expertRiskGrade: 'green',
      options: [],
      repeatTableColumns: [],
      required: false,
      condition: null,
      sourceScope: 'custom',
      orderIndex: 0,
    }],
  }
}

function sections(list, help, requiredDefault) {
  return list.map((sec, si) => {
    const [num, title, desc, level, qs] = sec
    return {
      id: `sec_${num}`,
      title: `${num} · ${title}`,
      description: desc,
      orderIndex: si,
      placements: qs.map((q, qi) => placement(q, num, qi, requiredDefault && level === '필수', help)),
    }
  })
}

/* 로컬 서버로 index.html 을 띄우고 문항 데이터를 읽어온다 */
const server = createServer(async (req, res) => {
  const rel = (req.url || '/').split('?')[0]
  const file = rel === '/' ? 'index.html' : rel.slice(1)
  try {
    const buf = await readFile(path.join(ROOT, file))
    const ext = path.extname(file)
    res.writeHead(200, {
      'Content-Type': ext === '.html' ? 'text/html; charset=utf-8'
        : ext === '.js' ? 'application/javascript' : 'application/octet-stream',
    })
    res.end(buf)
  } catch {
    res.writeHead(404); res.end('not found')
  }
})
await new Promise((r) => server.listen(8123, r))

const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'networkidle' })
const D = await page.evaluate(() => window.__CHECKLIST_DATA)
await browser.close()
server.close()

if (!D) throw new Error('window.__CHECKLIST_DATA 를 찾지 못했습니다. index.html 을 확인하세요.')

const blueprints = [
  {
    checklistPhase: 1,
    surveyTitle: 'AX 1차 사전 희망사항 & MVP 방향 체크리스트',
    introMessage: '첫 MVP를 실제 회사에 가깝게 만들기 위해 고객님의 판단이 필요한 부분을 확인합니다.',
    sections: (() => {
      const list = [...sections(D.core, D.help, true), ...sections(D.optional, D.help, false)]
      return [...list, freeNoteSection(list.length)]
    })(),
  },
  {
    checklistPhase: 2,
    surveyTitle: 'AX 2차 고도화 체크리스트',
    introMessage: '1차 MVP를 사용해보신 뒤 실제 회사 기준으로 고칠 부분을 정리합니다.',
    sections: (() => {
      const list = sections(D.core2, D.help, true)
      return [...list, freeNoteSection(list.length)]
    })(),
  },
]

for (const b of blueprints) {
  b.questionCount = b.sections.reduce((n, s) => n + s.placements.length, 0)
  b.estimatedMinutes = b.checklistPhase === 1 ? 15 : 10
  b.source = 'client-checklist'
}

writeFileSync(path.join(ROOT, 'os-integration/blueprint.json'), JSON.stringify(blueprints, null, 2) + '\n')

const sqlLiteral = (o) => "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb"
const rows = blueprints.map((b) => `
-- ${b.surveyTitle} (문항 ${b.questionCount}개)
insert into public.survey_blueprints (workspace_id, project_id, status, payload)
select v_workspace, null, 'published', ${sqlLiteral(b)}
where not exists (
  select 1 from public.survey_blueprints
   where workspace_id = v_workspace
     and payload ->> 'source' = 'client-checklist'
     and (payload ->> 'checklistPhase')::int = ${b.checklistPhase}
);
update public.survey_blueprints
   set payload = ${sqlLiteral(b)}, status = 'published', updated_at = now()
 where workspace_id = v_workspace
   and payload ->> 'source' = 'client-checklist'
   and (payload ->> 'checklistPhase')::int = ${b.checklistPhase};`).join('\n')

const sql = `-- =====================================================================
-- 미래AI랩 OS ← 고객 체크리스트 연동 설치 스크립트
-- 생성: os-integration/build-blueprint.mjs (직접 고치지 말고 스크립트를 다시 실행하세요)
-- ---------------------------------------------------------------------
-- 실행 방법
--   Supabase 대시보드 → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
--   그게 전부입니다. 파일을 고칠 필요 없습니다.
--
--   워크스페이스는 자동으로 찾습니다.
--   워크스페이스가 2개 이상이면 오류 메시지에 목록이 나오니,
--   그때만 아래 v_workspace 줄의 null 을 원하는 id 로 바꿔서 다시 실행하세요.
-- =====================================================================

do $$
declare
  -- 워크스페이스가 하나면 비워두세요(자동). 여러 개일 때만 id 를 적습니다.
  v_workspace uuid := null;
  v_count integer;
  v_list text;
begin
  if v_workspace is null then
    select count(*) into v_count from public.workspaces;
    if v_count = 0 then
      raise exception '워크스페이스가 하나도 없습니다. OS 에서 워크스페이스를 먼저 만들어주세요.';
    elsif v_count > 1 then
      select string_agg(format('%s → %s', id, coalesce(name, '(이름없음)')), chr(10)) into v_list from public.workspaces;
      raise exception '워크스페이스가 % 개입니다. 아래에서 하나를 골라 이 스크립트 위쪽 v_workspace 줄에 넣고 다시 실행하세요.%', v_count, chr(10) || v_list;
    end if;
    select id into v_workspace from public.workspaces limit 1;
  elsif not exists (select 1 from public.workspaces where id = v_workspace) then
    raise exception '그 워크스페이스를 찾을 수 없습니다: %', v_workspace;
  end if;
  raise notice '워크스페이스: %', v_workspace;
${rows.split('\n').map((l) => (l ? '  ' + l : l)).join('\n')}
end $$;

-- ---------------------------------------------------------------------
-- 체크리스트 링크 발급 함수
--   먼저 프로젝트 id 를 확인합니다.
--     select id, payload->>'name' as 프로젝트명 from public.projects;
--
--   그 id 를 넣어 링크를 만듭니다.
--     select public.issue_checklist_link(
--       '<프로젝트 id>'::uuid,      -- 위에서 복사한 id
--       1,                         -- 1차 = 1, 2차 = 2
--       '홍길동',                   -- 받는 분 성함
--       '대표이사',                 -- 직책
--       'https://<체크리스트주소>'   -- 배포 주소
--     );
--   반환된 url 을 고객에게 그대로 보내면 됩니다.
--   토큰은 해시로만 저장되므로 이 때 나온 url 을 꼭 보관하세요.
-- ---------------------------------------------------------------------
-- 인자 기본값이 바뀌면 create or replace 가 거부하므로 먼저 지운다.
drop function if exists public.issue_checklist_link(uuid, uuid, integer, text, text, text);
drop function if exists public.issue_checklist_link(uuid, integer, text, text, text);

create or replace function public.issue_checklist_link(
  p_project_id uuid,
  p_phase integer default 1,
  p_recipient_name text default '',
  p_recipient_position text default '',
  p_base_url text default 'https://example.vercel.app'
)
returns jsonb
language plpgsql
set search_path = public
as $fn$
declare
  bp public.survey_blueprints;
  tok text;
  dist_id uuid := gen_random_uuid();
  p_workspace_id uuid;
begin
  -- 프로젝트에서 워크스페이스를 자동으로 찾는다.
  select workspace_id into p_workspace_id from public.projects where id = p_project_id;
  if p_workspace_id is null then
    raise exception '그런 프로젝트가 없습니다. 아래로 확인하세요: select id, payload->>''name'' from public.projects;';
  end if;

  select * into bp
  from public.survey_blueprints
  where workspace_id = p_workspace_id
    and payload ->> 'source' = 'client-checklist'
    and (payload ->> 'checklistPhase')::int = p_phase
  order by updated_at desc
  limit 1;

  if bp.id is null then
    raise exception '체크리스트 블루프린트가 없습니다. 이 파일 위쪽의 등록 블록을 먼저 실행하세요. (phase=%)', p_phase;
  end if;

  -- URL 에 안전한 토큰 생성. 원문은 저장하지 않고 해시만 저장한다.
  tok := replace(replace(replace(encode(extensions.gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', '');

  insert into public.survey_distributions (id, workspace_id, project_id, access_token_hash, status, payload)
  values (
    dist_id, p_workspace_id, p_project_id, public.hash_access_token(tok), 'issued',
    jsonb_build_object(
      'id', dist_id,
      'projectId', p_project_id,
      'organizationId', '',
      'blueprintId', bp.id,
      'blueprintSnapshot', bp.payload -> 'sections',
      'respondentRole', 'owner',
      'surveyTitle', coalesce(bp.payload ->> 'surveyTitle', 'AX 체크리스트'),
      'recipientName', coalesce(p_recipient_name, ''),
      'recipientPosition', coalesce(p_recipient_position, ''),
      'recipientEmail', '',
      'recipientPhone', '',
      'status', 'issued',
      'introMessage', coalesce(bp.payload ->> 'introMessage', ''),
      'privacyNotice', '작성해주신 내용은 MVP 제작 목적으로만 사용됩니다.',
      'consentRequired', false,
      'expiresAt', null,
      'issuedAt', now(),
      'firstOpenedAt', null,
      'lastOpenedAt', null,
      'submittedAt', null,
      'revokedAt', null,
      'createdAt', now(),
      'updatedAt', now(),
      'checklistPhase', p_phase
    )
  );

  return jsonb_build_object(
    'distributionId', dist_id,
    'phase', p_phase,
    'url', rtrim(p_base_url, '/') || '/?t=' || tok || '&p=' || p_phase
  );
end;
$fn$;

-- 권한: 링크 발급은 로그인한 담당자만. 고객(anon)에게는 절대 열지 않는다.
-- (저장소의 다른 RPC 와 같은 방식)
revoke execute on function public.issue_checklist_link(uuid, integer, text, text, text) from public;
grant  execute on function public.issue_checklist_link(uuid, integer, text, text, text) to authenticated;
`
writeFileSync(path.join(ROOT, 'os-integration/install.sql'), sql)

console.log('완료')
for (const b of blueprints) console.log(`  ${b.checklistPhase}차: 섹션 ${b.sections.length}개 · 문항 ${b.questionCount}개`)
