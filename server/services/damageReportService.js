import DamageReport from '../models/DamageReport.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';

class DamageReportService {
  /**
   * Auto-resolve expired damage reports
   * This function should be called periodically (e.g., every hour)
   */
  static async autoResolveExpiredReports() {
    try {
      console.log('🔍 Checking for expired damage reports...');
      
      // Find all expired pending damage reports
      const expiredReports = await DamageReport.findExpiredReports();
      
      if (expiredReports.length === 0) {
        console.log('✅ No expired damage reports found');
        return { resolved: 0, errors: [] };
      }

      console.log(`📋 Found ${expiredReports.length} expired damage reports to resolve`);
      
      const results = {
        resolved: 0,
        errors: []
      };

      for (const report of expiredReports) {
        try {
          // Auto-resolve the report
          const wasResolved = report.autoResolveIfExpired();
          
          if (wasResolved) {
            await report.save();
            
            // Re-enable book listing after auto-resolution
            await Book.findByIdAndUpdate(report.book, {
              $set: { isAvailable: true },
              $unset: { unavailableReason: 1 }
            });

            // Notify both parties about auto-resolution
            await this.notifyAutoResolution(report);
            
            results.resolved++;
            console.log(`✅ Auto-resolved damage report ${report._id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to auto-resolve damage report ${report._id}:`, error);
          results.errors.push({
            reportId: report._id,
            error: error.message
          });
        }
      }

      console.log(`🎯 Auto-resolution complete: ${results.resolved} resolved, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      console.error('❌ Error in auto-resolve expired reports:', error);
      throw error;
    }
  }

  /**
   * Notify parties about auto-resolution
   */
  static async notifyAutoResolution(damageReport) {
    try {
      // Populate the report with necessary data
      await damageReport.populate([
        { path: 'book', select: 'title coverImage' },
        { path: 'reportedBy', select: 'name email' },
        { path: 'borrower', select: 'name email' }
      ]);

      // Notify the borrower
      await Notification.create({
        userId: damageReport.borrower._id,
        type: 'damage_report_auto_resolved',
        title: 'Damage Report Auto-Resolved',
        message: `The damage report for "${damageReport.book.title}" has been automatically resolved. Penalty of ₹${damageReport.finalPenaltyAmount} has been applied.`,
        fromUserId: damageReport.reportedBy._id,
        link: `/damage-reports/${damageReport._id}`,
        metadata: {
          damageReportId: damageReport._id,
          bookId: damageReport.book._id,
          bookTitle: damageReport.book.title,
          penaltyAmount: damageReport.finalPenaltyAmount,
          autoResolved: true
        }
      });

      // Notify the book owner
      await Notification.create({
        userId: damageReport.reportedBy._id,
        type: 'damage_report_auto_resolved',
        title: 'Damage Report Auto-Resolved',
        message: `Your damage report for "${damageReport.book.title}" has been automatically resolved. The borrower did not respond within the time limit.`,
        fromUserId: damageReport.borrower._id,
        link: `/damage-reports/${damageReport._id}`,
        metadata: {
          damageReportId: damageReport._id,
          bookId: damageReport.book._id,
          bookTitle: damageReport.book.title,
          penaltyAmount: damageReport.finalPenaltyAmount,
          autoResolved: true
        }
      });

      console.log(`📧 Auto-resolution notifications sent for damage report ${damageReport._id}`);
    } catch (error) {
      console.error(`❌ Failed to send auto-resolution notifications for damage report ${damageReport._id}:`, error);
      // Don't throw error here as the main resolution was successful
    }
  }

  /**
   * Get damage report statistics
   */
  static async getStatistics() {
    try {
      const stats = await DamageReport.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalPenalty: { $sum: '$finalPenaltyAmount' }
          }
        }
      ]);

      const severityStats = await DamageReport.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
            avgPenalty: { $avg: '$autoPenaltyAmount' }
          }
        }
      ]);

      const recentReports = await DamageReport.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      return {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalPenalty: stat.totalPenalty || 0
          };
          return acc;
        }, {}),
        bySeverity: severityStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgPenalty: Math.round((stat.avgPenalty || 0) * 100) / 100
          };
          return acc;
        }, {}),
        recentReports,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error getting damage report statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old resolved damage reports (older than 1 year)
   */
  static async cleanupOldReports() {
    try {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      
      const result = await DamageReport.deleteMany({
        status: { $in: ['resolved', 'accepted'] },
        updatedAt: { $lt: oneYearAgo }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old damage reports`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old damage reports:', error);
      throw error;
    }
  }
}

export default DamageReportService;