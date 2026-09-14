export const sandboxConfig = {
  mimotoBase: process.env.MIMOTO_BASE_URL || 'https://api.collab.mosip.net/v1/mimoto',
  redirectUri: process.env.SANDBOX_REDIRECT_URI || 'io.mosip.residentapp.inji://oauthredirect',
  mockUin: process.env.MOCK_UIN || '5860356276',
  mockOtp: process.env.MOCK_OTP || '111111',
  acrValues: process.env.SANDBOX_ACR_VALUES || 'mosip:idp:acr:generated-code',
  httpTimeoutMs: Number(process.env.SANDBOX_TIMEOUT_MS || 15000),
  transactionRetries: Number(process.env.SANDBOX_TXN_RETRIES || 3),
  // Per-step ceiling for the state-machine timeout guard (07_State_Machine.md §5).
  stepTimeoutMs: Number(process.env.STEP_TIMEOUT_MS || 30000),
};
