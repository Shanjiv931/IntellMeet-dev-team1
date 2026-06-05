import Meeting from '../models/Meeting.model.js';
import Task from '../models/Task.model.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Fetch and compile aggregated user analytics data
 * GET /api/analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const rawUserId = req.user._id || req.user.id;
    const userId = new mongoose.Types.ObjectId(rawUserId);

    logger.debug(`Fetching analytics data for user: ${rawUserId}`);

    // 1. Meeting Stats overview
    const meetingStats = await Meeting.aggregate([
      {
        $match: {
          $or: [{ host: userId }, { participants: userId }]
        }
      },
      {
        $group: {
          _id: null,
          totalMeetings: { $sum: 1 },
          totalDurationMinutes: { $sum: { $ifNull: ["$duration", 30] } },
          aiSummariesCount: {
            $sum: { $cond: [{ $eq: ["$aiGenerated", true] }, 1, 0] }
          },
          actionItemsTotal: { $sum: { $size: { $ifNull: ["$actionItems", []] } } },
          actionItemsCompleted: {
            $sum: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$actionItems", []] },
                  as: "item",
                  cond: { $eq: ["$$item.completed", true] }
                }
              }
            }
          }
        }
      }
    ]);

    const mStats = meetingStats[0] || {
      totalMeetings: 0,
      totalDurationMinutes: 0,
      aiSummariesCount: 0,
      actionItemsTotal: 0,
      actionItemsCompleted: 0
    };

    // 2. Task stats overview
    const taskStats = await Task.aggregate([
      {
        $match: {
          $or: [{ creator: userId }, { assignee: userId }]
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] }
          }
        }
      }
    ]);

    const tStats = taskStats[0] || {
      totalTasks: 0,
      completedTasks: 0
    };

    // 3. Trends (last 30 days daily meetings count & average duration)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const meetingsTrend = await Meeting.aggregate([
      {
        $match: {
          $or: [{ host: userId }, { participants: userId }],
          startTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          count: { $sum: 1 },
          avgDuration: { $avg: { $ifNull: ["$duration", 30] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Task status breakdown
    const taskBreakdown = await Task.aggregate([
      {
        $match: {
          $or: [{ creator: userId }, { assignee: userId }]
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const defaultBreakdown = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    taskBreakdown.forEach(item => {
      if (item._id in defaultBreakdown) {
        defaultBreakdown[item._id] = item.count;
      }
    });

    const taskStatusDistribution = Object.keys(defaultBreakdown).map(key => ({
      status: key,
      count: defaultBreakdown[key]
    }));

    // 5. Topics frequency
    const topTopics = await Meeting.aggregate([
      {
        $match: {
          $or: [{ host: userId }, { participants: userId }]
        }
      },
      { $unwind: "$keyDiscussionPoints" },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$keyDiscussionPoints" } } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const topicsList = topTopics
      .filter(t => t._id && t._id.trim() !== '')
      .map(t => ({
        topic: t._id.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count: t.count
      }));

    // 6. Active days weekly breakdown
    const activeDays = await Meeting.aggregate([
      {
        $match: {
          $or: [{ host: userId }, { participants: userId }]
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$startTime" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let mostActiveDayStr = "N/A";
    if (activeDays.length > 0) {
      const dayIdx = activeDays[0]._id - 1; // Mongo: 1=Sunday, 7=Saturday
      if (dayIdx >= 0 && dayIdx < 7) {
        mostActiveDayStr = daysOfWeek[dayIdx];
      }
    }

    // Calculations for productivity insights
    const totalMeetings = mStats.totalMeetings;
    const totalHours = Number((mStats.totalDurationMinutes / 60).toFixed(1));
    const completedTasks = tStats.completedTasks;
    const totalTasks = tStats.totalTasks;
    const aiSummaries = mStats.aiSummariesCount;

    const avgMeetingDuration = totalMeetings > 0 
      ? Number((mStats.totalDurationMinutes / totalMeetings).toFixed(1)) 
      : 0;

    const taskCompletionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    const actionItemsCreated = mStats.actionItemsTotal;
    const actionItemsCompleted = mStats.actionItemsCompleted;
    const actionItemCompletionRate = actionItemsCreated > 0
      ? Math.round((actionItemsCompleted / actionItemsCreated) * 100)
      : 0;

    // Team Productivity Score Algorithm:
    // 40% task completion rate, 40% action item completion rate, 20% meeting consistency (meetings count ratio out of 10)
    const meetingConsistency = Math.min((totalMeetings / 10) * 100, 100);
    const productivityScore = Math.round(
      (taskCompletionRate * 0.4) + 
      (actionItemCompletionRate * 0.4) + 
      (meetingConsistency * 0.2)
    ) || 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMeetings,
          totalHours,
          totalTasks,
          completedTasks,
          aiSummaries
        },
        trends: {
          meetingsTrend,
          taskStatusDistribution
        },
        productivity: {
          avgMeetingDuration,
          taskCompletionRate,
          actionItemsCreated,
          actionItemsCompleted
        },
        insights: {
          mostActiveDay: mostActiveDayStr,
          avgSpeakingTime: "N/A",
          topTopics: topicsList,
          productivityScore
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
