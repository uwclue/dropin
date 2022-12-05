import React, { useEffect } from 'react';
import { GoogleLogin } from 'react-google-login';
import { gapi } from 'gapi-script';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

function App() {
  const clientId = '110472664872-m0sr0ve6g2lhf0ggb9h2jqkfb04guqjj.apps.googleusercontent.com';
  const spreadsheetId = '181yQzf2O8gddmjaFzJr4zWhMQy_bl39GcaiPYV4xZRo';

  const [ dropdownOptions, setDropdownOptions ] = React.useState([]);

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        clientId: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
      })
    }
    gapi.load('client::auth2', initClient);
  })

  const onSuccess = (_) => {
  }

  const getTopicOptions = () => {
    gapi.client.request({
      'path': `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:A`,
      'method': 'GET',
    }).then((res) => {
      setDropdownOptions(res.result.values.map((x) => x[0]));
    })
  }

  return (
    <div>
      <GoogleLogin
        clientId={clientId}
        buttonText='Sign in with Google'
        onSuccess={onSuccess}
      />
      <button onClick={getTopicOptions}> Click </button>
      <Autocomplete
        id='topics-dropdown'
        options={dropdownOptions}
        renderInput={(params) => <TextField {...params} label='Topic' />}
      />
    </div>
  );
}

export default App;