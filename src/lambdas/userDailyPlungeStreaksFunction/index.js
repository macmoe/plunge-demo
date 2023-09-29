'user_strict'
const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
  // Check for the user_id value, so we can fetch the correct user data.
  let user_id = parseInt(event.pathParameters?.user_id ?? event.body?.user_id ?? 0, 10);
  if (user_id <= 0) { return errorResponse(400, 'Invalid/missing user_id attribute'); }
  
  // Check the users current local time, or use current time as default.
  let current_date = new Date(event.queryStringParameters?.current_date ?? event.body?.current_date ?? (new Date()).getTime());
  current_date.setHours(0,0,0,0);

  // Try fetching the plunge session data, manipulated it, and send back a response
  try {
    const dbData = await fetchSessions(user_id);
    const aggregatedStreakData = aggredateStreaks(dbData.Items ?? [], current_date);
    aggregatedStreakData['user_id'] = user_id;
    return sendResponse(200, aggregatedStreakData);
  } catch (err) {
    return errorResponse(403, { error: err });
  }
};

// Sorts the dailyPlungeSessions aka sessions by `local_datetime` 
const sortSessionsByLocalDatetime = (sessions) => {
  let sortedSessions = sessions.sort((sessionA, sessionB) => {
    return new Date(sessionA.local_datetime) - new Date(sessionB.local_datetime);
  });
  return sortedSessions;
};

// Determine the currentSteak, longestStreak, and sessionsPast7Days for an array of dailyPlungeSessions aka sessions.
const aggredateStreaks = (sessions, current_date) => {
  // First sort the sessions
  const sortedSessions = sortSessionsByLocalDatetime(sessions);
  // Next create a filterSessions data (aka no duplicates on the same day)
  const filteredSessions = filterAndReduceSessionData(sortedSessions);
  // Now iterate through the sessions and start counting the streaks...
  let currentStreak = 0;
  let longestStreak = 0;
  let nextDateTime = null;
  filteredSessions.forEach((session) => {
    let curDateTime = new Date(session.dateTime);
    if (nextDateTime == null) { nextDateTime = curDateTime; }
    if (nextDateTime.getTime() == curDateTime.getTime()) {
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
    nextDateTime = addDaysToDate(curDateTime, 1);
  });
  // Now filter the array down the start of the week, which is Sunday.
  let start_date = new Date((new Date(current_date)).setDate(current_date.getDate() - current_date.getDay()));
  const totalSessionPast7Days = sortedSessions.filter((session) => {
    let date = new Date(session.local_datetime);
    return date > start_date && date <= current_date;
  });
  return {
    currentStreak: currentStreak,
    longestStreak: longestStreak,
    sessionsThisWeek: totalSessionPast7Days.length
  };
};

// Helper method to create a new date and add days to it. Use negative numbers to subtract days.
const addDaysToDate = (date, days) => {
  let newDate = new Date(date.getTime());
  newDate.setDate(date.getDate() + days);
  return newDate;
};

// Removes any duplicate dailyPlungeSessions aka sessions per day.
// We assume the sessions are already sorted by local_datetime value
const filterAndReduceSessionData = (sortedSessions) => {
  let reducedSessions = [];
  let lastDateKey = '';
  sortedSessions.forEach((session) => {
    try {
      let dateKey = session.local_datetime.split(' ').shift();
      if (lastDateKey != dateKey) {
        lastDateKey = dateKey;
        reducedSessions.push({ dateTime: new Date(dateKey) });
      }
    } catch (err) {
      console.error(`Invalid local_datetime: ${session.local_datetime}`);
    }
  });
  return reducedSessions;
};

// This method will simply pull all dailyPlungeSessions aka session from a db
const fetchSessions = async (user_id) => {
  const dynamoDB = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: "DailyPlungeSessions",
    FilterExpression: '#user_id = :value',
    ExpressionAttributeNames: { '#user_id': 'user_id' },
    ExpressionAttributeValues: { ':value': `${user_id}` }
  };
  return await dynamoDB.scan(params).promise();
};

// Simple method for sending back a response, all returns from the handler should flow through this method
const sendResponse = (code, body) => {
  return {
    statusCode: code,
    body: JSON.stringify(body)
  };
};

// Simple method for formating error responses
const errorResponse = (code, message) => {
  return sendResponse(code, { message: message });
};