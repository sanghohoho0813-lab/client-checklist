/* =====================================================================
 * 미래AI랩 OS 연동 설정
 * ---------------------------------------------------------------------
 * AX-MVP-Factory-OS 의 Supabase 프로젝트 값을 넣으세요.
 * (OS 저장소의 .env 에 있는 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 와 동일한 값)
 *
 * 키는 아래 둘 중 아무거나 됩니다 (Supabase → Settings → API Keys).
 *   · 새 형식  sb_publishable_...        ← Publishable key 탭
 *   · 구형 형식 eyJhbGci...                ← Legacy anon, service_role API keys 탭의 anon
 * 둘 다 브라우저에 노출되는 것을 전제로 설계된 공개 키입니다.
 * 이 키로 할 수 있는 일은 "발급된 토큰이 가리키는 그 한 건에 응답 저장"뿐이며,
 * 나머지는 Supabase 의 RLS 가 막습니다.
 * service_role / secret 키는 절대 이 파일에 넣지 마세요.
 *
 * 두 값이 비어 있으면 제출 버튼이 나타나지 않고,
 * 기존처럼 카톡용 저장 / PDF 저장만 동작합니다.
 * ===================================================================== */
window.MIRAE_CONFIG = {
  supabaseUrl: 'https://uefsdtlcybemoyoxncyn.supabase.co',
  supabaseAnonKey: 'sb_publishable_6-6Ft4beEDK01JeXlPVTGA_PboVEMaU',
};
