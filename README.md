# AX 사전 희망사항 & MVP 방향 체크리스트

미래AI랩(MIRAE AI LAB) 고객용 사전 체크리스트입니다.
빌드 과정이 없는 **정적 HTML 1페이지**라서 Vercel에 그대로 올리면 바로 링크가 만들어집니다.

- 필수 9개 항목(01~09) + 선택 4개 항목(A~D), 총 33개 질문
- 작성 내용은 **고객 브라우저에 자동 저장**(localStorage)되어 중간에 나갔다 와도 이어서 작성 가능
- 결과 회수: **카톡용 저장**(클립보드 복사 + TXT 다운로드), **PDF 저장**(인쇄 → PDF)

---

## 1. 파일 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 체크리스트 본문 전체(HTML·CSS·JS 한 파일) |
| `vercel.json` | Vercel 정적 배포 설정(캐시·보안 헤더) |
| `favicon.svg` | 브라우저 탭 아이콘 |
| `robots.txt` | 검색엔진 수집 차단(고객 전용 링크용) |

---

## 2. Vercel 배포 (링크 만들기)

1. [vercel.com](https://vercel.com) 로그인 → **Add New… → Project**
2. **Import Git Repository** 에서 `sanghohoho0813-lab/client-checklist` 선택
3. 설정은 **아무것도 건드리지 않고** 그대로 둡니다
   - Framework Preset: `Other`
   - Build Command / Output Directory: **비워둠** (정적 파일이라 빌드 불필요)
4. **Deploy** 클릭 → 약 20초 후 `https://client-checklist-xxxx.vercel.app` 링크 발급

### 브랜치 구성
Vercel은 **GitHub 기본 브랜치(default branch)** 를 실서비스(Production)로 배포합니다.

- `main` — 기본 브랜치. 여기에 올라간 내용이 고객에게 공유하는 **실제 링크**가 됩니다.
- `claude/github-vercel-setup-mn83yv` — 최초 세팅 작업 브랜치(`main` 과 동일 내용). 정리하고 싶으면 삭제해도 됩니다.

앞으로 수정은 `main` 에 push 하면 됩니다.

### 도메인 연결 (선택)
Vercel → **Settings → Domains** 에서 `ax.회사도메인.com` 같은 주소를 연결할 수 있습니다.
링크가 짧고 회사 도메인이면 카톡 전달 시 신뢰도가 올라갑니다.

### 수정 반영
`index.html` 을 수정해서 `main` 에 push 하면 Vercel이 자동으로 재배포합니다.
`index.html` 에는 캐시 무효화 헤더가 걸려 있어 고객이 새로고침하면 항상 최신 버전을 봅니다.

---

## 3. 결과 회수 방식 (중요)

이 페이지는 **서버로 답변을 전송하지 않습니다.** 응답은 고객 기기 안에만 저장됩니다.
따라서 고객이 작성 완료 후 아래 중 하나로 결과를 보내주셔야 합니다.

- **카톡용 저장** → 텍스트가 클립보드에 복사되고 `AX_체크리스트_날짜.txt` 파일도 저장됨 → 카톡 채팅방에 붙여넣기 또는 파일 전송
- **PDF 저장** → 인쇄 창에서 "PDF로 저장" 선택 → 파일 전달

> 고객이 링크를 **카카오톡 안에서** 열면 파일 저장·인쇄가 막히는 경우가 있어,
> 카카오톡 내부 브라우저로 접속하면 "다른 브라우저로 열기" 안내 문구가 자동으로 표시됩니다.

나중에 응답을 자동으로 수집하고 싶다면 Google Forms 연동, Vercel Serverless Function + 시트/DB 저장 등을
추가 개발로 붙일 수 있습니다(현재 범위에는 포함되어 있지 않습니다).

---

## 4. 내용 수정 방법

질문·선택지·안내문구는 모두 `index.html` 하단 `<script>` 안의 데이터 배열에 있습니다.

| 이름 | 역할 |
|---|---|
| `core` | 필수 항목 01~09의 질문·선택지 |
| `optional` | 선택 항목 A~D의 질문·선택지 |
| `help` | 질문별 "왜 필요한가요 / 예시 / 어디에 반영되나요" 3줄 안내 |
| `groups` | 선택지를 소그룹으로 묶는 정의 |
| `subheads` | 항목 안의 소목차 구성 |
| `secColors` | 항목별 색상 |

수정 시 주의사항

- 선택지를 추가하면 `groups` 의 해당 그룹에도 같은 문구를 넣어야 화면에 표시됩니다(그룹이 정의된 질문에 한함).
- 질문을 추가하면 `subheads` 의 해당 항목 소목차에도 질문 key를 넣어야 표시됩니다.
- 저장 키(`KEY = "mirae_ax_prebrief_v18"`)를 바꾸면 기존 작성 내용이 초기화됩니다. 질문을 크게 바꿀 때는 버전을 올려주세요.

---

## 5. 검색엔진 노출

고객 전용 링크라서 기본값은 **검색 노출 차단**입니다.
공개하고 싶다면 두 곳을 함께 수정하세요.

1. `robots.txt` 의 `Disallow: /` 삭제
2. `index.html` 의 `<meta name="robots" content="noindex,nofollow">` 삭제

---

## 6. 로컬에서 확인하기

```bash
npx http-server -p 8080 .
# 또는
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속.
(파일을 더블클릭해 `file://` 로 열면 클립보드 복사가 동작하지 않으니 위 방식으로 확인하세요.)
