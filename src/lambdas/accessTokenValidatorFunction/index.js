exports.handler = async (event) => {
  // Normally this function would validate the JWT accessToken, but in this example
  // we are just going to check to see if the user has passed in an `access-token`
  // with the value of starting with `valid-token-`, else we will not allow this user to continue.
  let authorized = false;
  let user_id = '';
  let accessToken = '';
  let usageIdentifierKey = ''; 
  try {
    accessToken = event.headers['access-token'];
    usageIdentifierKey = event.requestContext.identity.apiKey;
  } catch (err) {
    console.error('No access-token passed to function');
  }
  if (accessToken && accessToken.toLowerCase().startsWith('valid-token-')) {
    // Just doing some silly logic to sudo-validate and pull the user_id from the token.
    user_id = accessToken.split('-')[2];
  }
  let responseBody = {
    "principalId": `${user_id}`,
    "policyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "execute-api:Invoke",
          "Effect": (user_id.length > 0 && event.resource.replace('{user_id}', user_id) == event.path) ? 'Allow' : 'Deny',
          "Resource": event.methodArn
        }
      ]
    },
    "context": {},
    "usageIdentifierKey": usageIdentifierKey
  }
  return responseBody;
};