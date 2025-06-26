import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  constructor() {
    this.isEnabled = false; // Disable analytics
  }

  // Initialize analytics
  async initialize() { return false; }

  // Track screen views
  async trackScreen() { return; }

  // Track quiz events
  async trackQuizEvent() { return; }

  // Track answer selection
  async trackAnswerSelected() { return; }

  // Track streak milestones
  async trackStreakMilestone() { return; }

  // Track time earned
  async trackTimeEarned() { return; }

  // Track daily score
  async trackDailyScore() { return; }

  // Track user engagement
  async trackUserEngagement() { return; }

  // Track app launches
  async trackAppLaunch() { return; }

  // Track settings changes
  async trackSettingsChange() { return; }

  // Track errors
  async trackError() { return; }

  // Set user properties
  async setUserProperty() { return; }

  // Toggle analytics (for privacy)
  async toggleAnalytics() { this.isEnabled = false; return; }
}

export default new AnalyticsService(); 