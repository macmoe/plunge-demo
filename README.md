# Plunge AWS Lambda Assignment

This assignment is to design and implement a serverless API in AWS, focusing on solving a Plunge real world use case, aka retrieving a user’s cold plunge current streaks, longest streak, and the number of cold plunge sessions for the week. The results returned would be rendered to the user in the iOS app.

# How to Install/Setup

This project is to be manually setup in AWS. You are expected to have general knowlege of AWS and how to configure services such as DynamoDB, IAM, Lambdas, API Gatways, S3, and others. Here are the following steps to setup this project:

* DynamoDB Setup
    * Navigate to S3 and create a bucket (name it `plunge-import`) and then upload the `/sample_data/DailyPlungeSessions.csv` file to it.
    * Navigate to DynamoDB and selec the appropriate Region (us-east-2)
    * Select the Import from S3 option and follow the instructions
        * Import from S3
        * Select the Source S3 URL bucket where you updated the `/sample_data/DailyPlungeSessions.csv` file.
        * Select CSV and next
        * Name the new table `DailyPlungeSessions` with a Partition key of `id` of type Number.
        * Select next, next, and import.
* IAM Role/Policy Setup
    * Navigate to IAM Roles
    * Select Create Role
    * Trusted enity type = AWS service
    * Use Case = Lambda
    * Select next
    * Add `AWSLambdaBasicExecutionRole`
    * Select next
    * Role name = `PlungeLambdaDynamoDBRole`
    * Select Create Role
    * Now search for the `PlungeLambdaDynamoDBRole` and select it
    * Select Add Permissions, select Create inline policy 
    * Find DynamoDB and select
    * For now, select `All DynamoDB actions (dynamodb:*)` and `All` under Resources. Note: For best practices we should only add the least amount of priviledges.
    * Select next
    * Policy name = `PlungeDynamoDBReadWriteAccessAll`
    * Select Create Policy
* Lambda Setup - accessTokenValidatorFunction
    * Naviage to Lambda and verify you are still in the us-west-2 region
    * Select Create function
    * Author from scratch should be selected
    * Function name = `accessTokenValidatorFunction`
    * Runtime = Node.js 16.x
    * Select Create function
    * Copy the contenst of `src/lambdas/accessTokenValidatorFunction/index.js` and paste it in the `index.js` file.
    * Select Deploy
* Lambda Setup - userPlungeSessionsFunction
    * Naviage to Lambda and verify you are still in the us-west-2 region
    * Select Create function
    * Author from scratch should be selected
    * Function name = `userPlungeSessionsFunction`
    * Runtime = Node.js 16.x
    * Select Create function
    * Copy the contenst of `src/lambdas/userPlungeSessionsFunction/index.js` and paste it in the `index.js` file.
    * Select Deploy
    * Select the Configuration tab
    * Select Permissions and select edit
    * Change the Existing role to the `PlungeDynamoDBReadWriteAccessAll` role you created earlier
* Lambda Setup - userDailyPlungeStreaksFunction
    * Naviage to Lambda and verify you are still in the us-west-2 region
    * Select Create function
    * Author from scratch should be selected
    * Function name = `userDailyPlungeStreaksFunction`
    * Runtime = Node.js 16.x
    * Select Create function
    * Copy the contenst of `src/lambdas/userDailyPlungeStreaksFunction/index.js` and paste it in the `index.js` file.
    * Select Deploy
    * Select the Configuration tab
    * Select Permissions and select edit
    * Change the Existing role to the `PlungeDynamoDBReadWriteAccessAll` role you created earlier
* API Gateway Setup - Base
    * Naviage to API Gateway and verify you are still in the us-west-2 region
    * Select APIs and then select CreateAPI
    * Select the Build button under REST API 'Develop a REST API where you gain complete control over the request and response along with API management capabilities.'
    * New API should be selected
    * API Name = `PlungeDemo`
    * Select Create API button
* API Gateway Setup - Creating Resources
    * Naviage to API Gateway and verify you are still in the us-west-2 region
    * Select APIs and then selec the `PlungeDemo`
    * -- This creates the `users` resource
        * Select Create resource button
        * Resource path = `/` and Resource name = `users`
        * Select Create resource button 
    * -- This creates the `{user_id}` resource
        * Select Create resource button
        * Resource path = `/users/` and Resource name = `{user_id}`
        * Select Create resource button 
    * -- This creates the `plungeSessions` resource
        * Select Create resource button
        * Resource path = `/users/{user_id}/` and Resource name = `plungeSessions`
        * Select Create resource button 
    * -- This creates the `dailyPlungeStreaks` resource
        * Select Create resource button
        * Resource path = `/users/{user_id}/` and Resource name = `dailyPlungeStreaks`
        * Select Create resource button 
    * Select the `/` under the Resources
    * Under Methods, select Create method
    * Method type = GET
    * Selec the Mock option
    * Select Create method button
    * Now select the Deploy API button so we can create a stage.
    * Stage = *New Stage*
    * Stage name = `dev`
    * Select the Deploy button - Once deplyed, you should be able to find the Invoke URL and you should be able to have this rendered in a browser (blank page).
* API Gateway - API Keys
    * Select API Keys (left menu)
    * Select Create API Key
    * Name = `iOS App API Key`
    * Select Save (Copy this API Key as we will use this later)
    * Select Usage Plans (left menu)
    * Select Create usage plan
    * Name = `Unlimited iOS Usage`
    * Unselect Throttling
    * Unselect Quota
    * Select Create usage plan button
    * Now that the Usage plan is create, select it `Unlimited iOS Usage`
    * Under Associated Stages, select Add API Stage
    * API = `PlungeDemo`
    * Stage = `dev`
    * Select the Add to usage plan button
    * Under Associated API Keys, select Add API Key
    * Type = Add existing key
    * API Key = `iOS App API Key`
    * Select the Add to usage plan button
* API Gateway - Authorization
    * Select Authorizers (left menu)
    * Select Create authorizer
    * Authorizer Name = `accessTokenValidatorFunction`
    * Authroizer type = Lambda
    * Lambda function = us-east-2 & `arn:aws:lambda:us-east-2:XXXXXX:function:accessTokenValidatorFunction`
    * Lambda event payload = Request
    * Header = `access-token`
    * Unselect Authorization caching
    * Select Create authorizer
* API Gateway Setup - Linking Methods to Lambdas
    * Naviage to API Gateway and verify you are still in the us-west-2 region
    * Select APIs and then selec the `PlungeDemo`
    * -- This add GET for plungeSessions
        * Select the `/plungeSessions` under the Resources
        * Under Methods, select Create method
        * Method type = GET
        * Selec the Lambda function option
        * Enable the Lamdba proxy integration
        * Lambda function = us-east-2 & `arn:aws:lambda:us-east-2:XXXXXX:function:userPlungeSessionsFunction`
        * Select Create method button
        * Under the Method request settings box, select the Edit button
        * Authorization = `accessTokenValidatorFunction`
        * Select the API key required checkbox
        * Select the Save button
    * -- This add GET for dailyPlungeStreaks
        * Select the `/dailyPlungeStreaks` under the Resources
        * Under Methods, select Create method
        * Method type = GET
        * Selec the Lambda function option
        * Enable the Lamdba proxy integration
        * Lambda function = us-east-2 & `arn:aws:lambda:us-east-2:XXXXXX:function:userDailyPlungeStreaksFunction`
        * Select Create method button
        * Under the Method request settings box, select the Edit button
        * Authorization = `accessTokenValidatorFunction`
        * Select the API key required checkbox
        * Select the Save button
    * Now select the Deploy API button so we can create a stage.
        * Stage = `dev`
        * Select the Deploy button

> Note: This is a lot to implement manually, so normally I would use either make a script with the AWS CLI to confirgure the environment or even better, implement a Terraform configuration to autobuild the enviornment.

# How to Invoke Endpoints

The following are the implemented endpoints:

| METHOD | Endpoint | Parameters | Response |
| :-: | :- | :- | :- |
| GET | `/users/{user_id}/plungeSessions` | None | Returns a JSON object which contains a list of the user's cold plunge sessions. |
| GET | `/users/{user_id}/dailyPlungeStreaks` | None | Returns an object with the calculated current streak, longest streak, and number of session the user has cold plunged this week. | 

## API Key

This API reuires an API when invoking, which can be included as followed:

* Header Attribute: `x-api-key: XXXXXXXXXXXXXXXXXXXXXX`

## Authentication 

This API reuires Authentication when invoking user resources. The authentication can be included as followed:

* Header Attribute: `access-token: XXXXXXXXXXXXXXXXXXXXXX`

## Example cURL Commands

The following are example cURL commands to invoke the endpoints:

### PlungeSessions

```
curl --location 'https://[aws-api-gatway-url]/dev/users/1000/plungeSessions' \
--header 'x-api-key: XXXXXXXXXXXXXXXXXXXXXX' \
--header 'access-token: XXXXXXXXXXXXXXXXXXXXXX'
```

#### Sample Results

```
{
    "user_id": 1000,
    "sessions": [
        {
            "updated_at": "8/10/2023 13:13",
            "local_datetime": "8/10/2023 6:13",
            "user_id": "1000",
            "created_at": "8/10/2023 13:13",
            "session_duration": "0:01:00",
            "zone_offset": "-420",
            "start_time": "6:11:06",
            "id": 2572,
            "end_time": "6:12:06"
        },
        ...
        {
            "updated_at": "9/26/2023 23:11",
            "local_datetime": "9/26/2023 16:11",
            "user_id": "1000",
            "created_at": "9/26/2023 23:11",
            "session_duration": "0:02:00",
            "zone_offset": "-420",
            "start_time": "16:09:42",
            "id": 5192,
            "end_time": "16:11:42"
        }
    ],
    "count": 84
}
```

### DailyPlungeStreaks
```
curl --location 'https://[aws-api-gatway-url]/dev/users/1000/dailyPlungeStreaks' \
--header 'x-api-key: XXXXXXXXXXXXXXXXXXXXXX' \
--header 'access-token: XXXXXXXXXXXXXXXXXXXXXX'
```

#### Sample Results
```
{
    "currentStreak": 48,
    "longestStreak": 48,
    "sessionsThisWeek": 4,
    "totalSessions": 84,
    "user_id": 1000
}
```