export const config = {
  siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  environment: (process.env.SCHOOL_ENVIRONMENT === 'production' ? 'production' : 'staging') as 'staging' | 'production',
  /** Samples and staging credentials use the staging address; production uses the configured school address. */
  get verifyBaseUrl() {
    if (this.environment === 'production' && process.env.VERIFY_BASE_URL) return process.env.VERIFY_BASE_URL.replace(/\/$/, '')
    return this.siteUrl
  },
  blobEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  rateLimitSalt: process.env.RATE_LIMIT_SALT || 'ivory-cradle-school',
  contactEmail: process.env.SCHOOL_CONTACT_EMAIL || '',
}

export const isStaging = () => config.environment === 'staging'

// Viewing rules. The server never credits more lesson time than real time allows.
export const VIEWING = {
  beatIntervalSeconds: 5, // the player reports progress this often while playing
  minBeatGapSeconds: 3, // reports closer together than this are not credited
  maxCreditGapSeconds: 7, // after a gap or pause, at most this much time is credited for one report
  toleranceSeconds: 0.75, // allowance for network delay per credited report
  completionToleranceSeconds: 1.5, // the final moments of the video count as complete
}

export const QUIZ = { questionsPerAttempt: 5, passScore: 4, attemptsPerCycle: 3 }
