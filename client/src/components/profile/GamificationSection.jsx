import React, { useState, useEffect } from 'react';
import { Trophy, Star, Users, TrendingUp, Target, Calendar, Award, Book, Heart } from 'lucide-react';
import { achievementsAPI, clubsAPI, challengesAPI } from '../../utils/gamificationAPI';
import AchievementCard from '../gamification/AchievementCard';
import UserStatsCard from '../gamification/UserStatsCard';
import LeaderboardCard from '../gamification/LeaderboardCard';

// Error boundary component
class GamificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Gamification error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">We're having trouble loading your gamification data.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const GamificationSection = ({ activeSubTab, setActiveSubTab }) => {
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);

      const [statsRes, achievementsRes, clubsRes, challengesRes] = await Promise.all([
        achievementsAPI.getUserStats().catch(() => ({ data: { data: { userStats: null } } })),
        achievementsAPI.getMyAchievements({ limit: 20 }).catch(() => ({ data: { data: { achievements: [] } } })),
        clubsAPI.getMyClubs().catch(() => ({ data: { data: { clubs: [] } } })),
        challengesAPI.getMyChallenges().catch(() => ({ data: { data: { challenges: [] } } }))
      ]);

      setUserStats(statsRes.data?.data?.userStats || null);
      setAchievements(achievementsRes.data?.data?.achievements || []);
      setMyClubs(clubsRes.data?.data?.clubs || []);
      setMyChallenges(challengesRes.data?.data?.challenges || []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      // Set default values on error
      setUserStats(null);
      setAchievements([]);
      setMyClubs([]);
      setMyChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    // Provide default stats if userStats is null
    const defaultStats = {
      gamification: {
        currentLevel: 1,
        totalPoints: 0,
        achievementsEarned: 0,
        experiencePoints: 0
      },
      reading: {
        booksRead: 0,
        readingStreak: { current: 0, longest: 0 }
      },
      sharing: {
        booksLent: 0
      },
      community: {
        clubsJoined: 0
      }
    };

    const stats = userStats || defaultStats;

    return (
      <div className="gamification-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon level">
              <span className="level-number">{stats.gamification?.currentLevel || 1}</span>
            </div>
            <div className="stat-content">
              <h3>Level {stats.gamification?.currentLevel || 1}</h3>
              <p>Reading Level</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon points">
              <Star size={24} />
            </div>
            <div className="stat-content">
              <h3>{(stats.gamification?.totalPoints || 0).toLocaleString()}</h3>
              <p>Total Points</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon achievements">
              <Trophy size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.gamification?.achievementsEarned || 0}</h3>
              <p>Achievements</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon books">
              <Book size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.reading?.booksRead || 0}</h3>
              <p>Books Read</p>
            </div>
          </div>
        </div>

        <div className="progress-section">
          <h4>Reading Progress</h4>
          <div className="progress-cards">
            <div className="progress-card">
              <div className="progress-header">
                <TrendingUp size={20} />
                <span>Reading Streak</span>
              </div>
              <div className="progress-value">
                {stats.reading?.readingStreak?.current || 0} days
              </div>
              <div className="progress-subtitle">
                Longest: {stats.reading?.readingStreak?.longest || 0} days
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-header">
                <Heart size={20} />
                <span>Books Shared</span>
              </div>
              <div className="progress-value">
                {stats.sharing?.booksLent || 0}
              </div>
              <div className="progress-subtitle">
                Community contributions
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-header">
                <Users size={20} />
                <span>Clubs Joined</span>
              </div>
              <div className="progress-value">
                {stats.community?.clubsJoined || 0}
              </div>
              <div className="progress-subtitle">
                Active memberships
              </div>
            </div>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="recent-achievements">
            <h4>Recent Achievements</h4>
            <div className="achievements-grid">
              {achievements.slice(0, 3).map((userAchievement, index) => (
                <div key={index} className="mini-achievement">
                  <div className="achievement-icon">{userAchievement.achievement.icon}</div>
                  <div className="achievement-info">
                    <h5>{userAchievement.achievement.name}</h5>
                    <p>{userAchievement.achievement.description}</p>
                    {userAchievement.completedAt && (
                      <span className="achievement-date">
                        {new Date(userAchievement.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAchievements = () => (
    <div className="achievements-section">
      <div className="section-header">
        <h4>Your Achievements</h4>
        <p>Track your progress and unlock new badges</p>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="loading-card">
              <div className="loading-shimmer"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((userAchievement, index) => (
            <AchievementCard
              key={index}
              achievement={userAchievement.achievement}
              userProgress={userAchievement}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderClubs = () => (
    <div className="clubs-section">
      <div className="section-header">
        <h4>My Book Clubs</h4>
        <p>Clubs you've joined and participate in</p>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-card">
              <div className="loading-shimmer"></div>
            </div>
          ))}
        </div>
      ) : myClubs.length > 0 ? (
        <div className="clubs-grid">
          {myClubs.map((club, index) => (
            <div key={index} className="club-card">
              <div className="club-header">
                <div className="club-avatar">
                  {club.coverImage ? (
                    <img src={club.coverImage} alt={club.name} />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div className="club-info">
                  <h5>{club.name}</h5>
                  <p>{club.description}</p>
                </div>
              </div>
              <div className="club-stats">
                <span>{club.currentMemberCount} members</span>
                <span className="club-role">{club.membershipRole}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={48} />
          <h5>No clubs joined yet</h5>
          <p>Join book clubs to connect with fellow readers and participate in discussions.</p>
        </div>
      )}
    </div>
  );

  const renderChallenges = () => (
    <div className="challenges-section">
      <div className="section-header">
        <h4>My Challenges</h4>
        <p>Active and completed reading challenges</p>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-card">
              <div className="loading-shimmer"></div>
            </div>
          ))}
        </div>
      ) : myChallenges.length > 0 ? (
        <div className="challenges-grid">
          {myChallenges.map((challenge, index) => (
            <div key={index} className="challenge-card">
              <div className="challenge-header">
                <div className="challenge-icon">
                  <Target size={24} />
                </div>
                <div className="challenge-info">
                  <h5>{challenge.title}</h5>
                  <p>{challenge.description}</p>
                </div>
              </div>
              <div className="challenge-progress">
                {challenge.userParticipation?.progress?.map((prog, i) => (
                  <div key={i} className="progress-item">
                    <span>{prog.metric}: {prog.current}/{prog.target}</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${prog.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Target size={48} />
          <h5>No active challenges</h5>
          <p>Join reading challenges to set goals and compete with other readers.</p>
        </div>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="leaderboard-section">
      <div className="section-header">
        <h4>Community Leaderboard</h4>
        <p>See how you rank among other readers</p>
      </div>
      <LeaderboardCard />
    </div>
  );

  const renderContent = () => {
    switch (activeSubTab) {
      case 'overview':
        return renderOverview();
      case 'achievements':
        return renderAchievements();
      case 'clubs':
        return renderClubs();
      case 'challenges':
        return renderChallenges();
      case 'leaderboard':
        return renderLeaderboard();
      default:
        return renderOverview();
    }
  };

  return (
    <GamificationErrorBoundary>
      <div className="gamification-section">
        <div className="gamification-nav">
          <button
            className={activeSubTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveSubTab('overview')}
          >
            <TrendingUp size={16} />
            Overview
          </button>
          <button
            className={activeSubTab === 'achievements' ? 'active' : ''}
            onClick={() => setActiveSubTab('achievements')}
          >
            <Trophy size={16} />
            Achievements
          </button>
          <button
            className={activeSubTab === 'clubs' ? 'active' : ''}
            onClick={() => setActiveSubTab('clubs')}
          >
            <Users size={16} />
            Clubs
          </button>
          <button
            className={activeSubTab === 'challenges' ? 'active' : ''}
            onClick={() => setActiveSubTab('challenges')}
          >
            <Target size={16} />
            Challenges
          </button>
          <button
            className={activeSubTab === 'leaderboard' ? 'active' : ''}
            onClick={() => setActiveSubTab('leaderboard')}
          >
            <Award size={16} />
            Leaderboard
          </button>
        </div>

        <div className="gamification-content">
          {renderContent()}
        </div>

        <style>{`
        .gamification-section {
          width: 100%;
        }

        .gamification-nav {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
          flex-wrap: wrap;
        }

        .gamification-nav button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          background: #f9fafb;
          color: #6b7280;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .gamification-nav button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .gamification-nav button.active {
          background: #4f46e5;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .stat-icon.level {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-icon.points {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-icon.achievements {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-icon.books {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .level-number {
          font-size: 1.25rem;
          font-weight: bold;
        }

        .stat-content h3 {
          font-size: 1.25rem;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .stat-content p {
          color: #6b7280;
          margin: 0;
          font-size: 0.875rem;
        }

        .progress-section {
          margin-bottom: 2rem;
        }

        .progress-section h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .progress-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .progress-card {
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .progress-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .progress-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
        }

        .progress-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .recent-achievements {
          margin-bottom: 2rem;
        }

        .recent-achievements h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .mini-achievement {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .achievement-icon {
          font-size: 2rem;
        }

        .achievement-info h5 {
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .achievement-info p {
          color: #6b7280;
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
        }

        .achievement-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .section-header {
          margin-bottom: 1.5rem;
        }

        .section-header h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .section-header p {
          color: #6b7280;
          margin: 0;
        }

        .clubs-grid, .challenges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .club-card, .challenge-card {
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .club-header, .challenge-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .club-avatar, .challenge-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.5rem;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .club-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.5rem;
        }

        .club-info h5, .challenge-info h5 {
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .club-info p, .challenge-info p {
          color: #6b7280;
          margin: 0;
          font-size: 0.875rem;
        }

        .club-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .club-role {
          background: #e0e7ff;
          color: #4f46e5;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }

        .challenge-progress {
          space-y: 0.5rem;
        }

        .progress-item {
          margin-bottom: 0.5rem;
        }

        .progress-item span {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .progress-bar {
          width: 100%;
          height: 0.5rem;
          background: #f3f4f6;
          border-radius: 0.25rem;
          overflow: hidden;
          margin-top: 0.25rem;
        }

        .progress-fill {
          height: 100%;
          background: #4f46e5;
          transition: width 0.3s ease;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .empty-state svg {
          margin: 0 auto 1rem auto;
          opacity: 0.5;
        }

        .empty-state h5 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0;
        }

        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .loading-card {
          height: 150px;
          background: #f9fafb;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .loading-shimmer {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      </div>
    </GamificationErrorBoundary>
  );
};

export default GamificationSection;