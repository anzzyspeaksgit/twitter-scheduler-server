# 📅 Twitter Scheduling Logic Explained

## How Auto-Scheduling Works

The extension uses an intelligent scheduling system that automatically finds the best times to post your tweets while avoiding conflicts.

## ⏰ Scheduling Rules

### 1. **Maximum Capacity**
- **24 tweets per day maximum** (one per hour)
- Minimum 30 minutes spacing between any two tweets
- Each hour slot can only have 1 tweet

### 2. **Optimal Posting Times**
The system prioritizes these high-engagement time slots:
- **Morning**: 7 AM, 8 AM, 9 AM
- **Lunch**: 12 PM, 1 PM
- **Evening**: 5 PM, 6 PM, 7 PM
- **Night**: 8 PM, 9 PM

### 3. **Conflict Detection**
The scheduler checks for:
- No more than 1 tweet in the same hour
- At least 30 minutes gap between tweets
- Avoids overlapping with already scheduled tweets

## 🔄 Auto-Schedule Algorithm

```
1. Check optimal hours for today
   ↓
2. If no slots available today, check tomorrow's optimal hours
   ↓
3. If optimal hours are full, check any available hour
   ↓
4. Continue for up to 7 days ahead
   ↓
5. Schedule at the first available slot found
```

## 📊 Scheduling Examples

### Example 1: Empty Schedule
- Current time: 10:00 AM
- Next auto-schedule slot: **12:00 PM** (next optimal hour)

### Example 2: Partially Filled
- Already scheduled: 12 PM, 5 PM, 8 PM
- Current time: 11:00 AM
- Next auto-schedule slot: **1:00 PM** (next available optimal hour)

### Example 3: Optimal Hours Full
- Already scheduled: All optimal hours taken
- Next auto-schedule slot: **First available non-optimal hour**

### Example 4: Maximum Daily Capacity
- Already scheduled: 24 tweets today
- Next auto-schedule slot: **Tomorrow's first optimal hour (7:00 AM)**

## 📈 Scheduling Statistics

The API provides real-time stats:
- Total scheduled tweets
- Daily distribution
- Hourly distribution
- Next 5 available time slots
- Optimal posting hours

## 🛠️ API Endpoints

### Auto-Schedule a Tweet
```
POST /api/auto-schedule
{
  "text": "Your tweet content",
  "images": []
}
```

### Get Scheduling Stats
```
GET /api/scheduling-stats

Response:
{
  "totalScheduled": 15,
  "maxPerDay": 24,
  "dailyDistribution": {
    "10/25/2025": 5,
    "10/26/2025": 10
  },
  "hourlyDistribution": [0,0,0,0,0,0,0,2,3,1,...],
  "nextAvailableSlots": [
    "2025-10-25T13:00:00Z",
    "2025-10-25T14:00:00Z",
    ...
  ],
  "optimalHours": [7,8,9,12,13,17,18,19,20,21]
}
```

## 🎯 Benefits

1. **Automatic Optimization**: Picks best engagement times
2. **Conflict Prevention**: Never double-books time slots
3. **Even Distribution**: Spreads tweets throughout the day
4. **24/7 Operation**: Works even with laptop closed
5. **Smart Fallback**: Uses any hour if optimal times are full

## 💡 Tips for Best Results

1. **Batch Scheduling**: Schedule multiple tweets at once for consistent posting
2. **Prime Time Focus**: System prioritizes high-engagement hours
3. **Buffer Management**: Maintains healthy spacing between tweets
4. **Weekly Planning**: Can schedule up to 7 days in advance

## 🔧 Customization

To modify optimal hours, edit in `scheduler-api.js`:
```javascript
const optimalHours = [7, 8, 9, 12, 13, 17, 18, 19, 20, 21];
```

To change maximum tweets per hour:
```javascript
// In hasConflictAt function
const tweetsInSlot = scheduledTimes.get(key) || 0;
return tweetsInSlot >= 1; // Change 1 to your desired max
```

## 📱 How It Looks in Extension

When you click "Auto Schedule":
1. Extension sends tweet to Railway server
2. Server finds next optimal slot
3. Creates cron job for that time
4. Returns confirmation with scheduled time
5. Tweet posts automatically at scheduled time

## 🌐 Server-Side Benefits

- **Always Running**: Railway server runs 24/7
- **Reliable**: Cron jobs execute even if Chrome is closed
- **Scalable**: Can handle hundreds of scheduled tweets
- **Real-time**: Posts exactly at scheduled time
