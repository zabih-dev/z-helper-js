import { getAccessToken, sendFcmMessage } from '../../lib';

import * as keys from '../firebase-adminsdk.json';

(async () => {
  const access_token = await getAccessToken({
    client_email: keys.client_email,
    private_key: keys.private_key,
  });
  console.log('access_token:', access_token);

  const device_token =
    'e4CdnQbuR02u5vXLvFej9D:APA91bGGg5JRrzbVcORfxYgGOZKWtIE-qdn2oyBajfLSmiZh5h8yl6YZWGh8lUGVg0aoZWoLcvsChRLtYiyLnZU-MAJaQYrgHjljjeegGLkgl8tY98xe5ZS4lfxRBDYaHr3UoXKN-rk9';

  sendFcmMessage({
    access_token: access_token,
    project_id: keys.project_id,
    payload_options: {
      message: {
        token: device_token,
        notification: { title: 'Test Notification', body: 'Hi there' },
      },
    },
  }).then(() => console.log('Sent successfully'));
})();
