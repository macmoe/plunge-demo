'user_strict'
const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
  // Check for the user_id value, so we can fetch the correct user data.
  let user_id = parseInt(event.pathParameters?.user_id ?? event.body?.user_id ?? 0, 10);
  if (user_id <= 0) { return errorResponse(400, 'Invalid/missing user_id attribute'); }
  
  // Lets fetch the data for the request and return it
  try {
    const dbData = await fetchSessions(user_id);
    let sortedSessions = sortSessionsByLocalDatetime(dbData.Items ?? []);
    let responseBody = {
      user_id: user_id,
      sessions: sortedSessions,
      count: sortedSessions.length 
    };
    return sendResponse(200, responseBody);
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