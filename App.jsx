import React, { useEffect } from 'react';
import { GoogleLogin } from 'react-google-login';
import { gapi } from 'gapi-script';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const filter = createFilterOptions();

function App() {
  const clientId = '110472664872-m0sr0ve6g2lhf0ggb9h2jqkfb04guqjj.apps.googleusercontent.com';
  const spreadsheetId = '181yQzf2O8gddmjaFzJr4zWhMQy_bl39GcaiPYV4xZRo';

  const [ dropdownOptions, setDropdownOptions ] = React.useState([]);
  const [ signedIn, setSignedIn ] = React.useState(false);
  const [ input, setInput ] = React.useState('');
  const [ loading, setLoading ] = React.useState(false);
  const [ addedTopics, setAddedTopics ] = React.useState([]);
  const [ snackbar, setSnackbar ] = React.useState('');
  const [ userEmail, setUserEmail ] = React.useState('');

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        clientId: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
      })
    }
    gapi.load('client::auth2', initClient);
  })

  const onSuccess = (res) => {
    setSignedIn(true);
    setUserEmail(res.profileObj.email);
  }

  const getTopicOptions = () => {
    setLoading(true);
    gapi.client.request({
      'path': `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:A`,
      'method': 'GET',
    }).then((res) => {
      if (res.result.values && res.result.values.length > 0) {
        setDropdownOptions(res.result.values.map((x) => x[0]));
      } else {
        setDropdownOptions([]);
      }
      setLoading(false);
    })
  }

  const onSelectOption = (option) => {
    if (option.startsWith('Add new topic')) {
      option = option.substring(15, option.length - 1);
    }
    if (!addedTopics.includes(option)) {
      setAddedTopics([...addedTopics, option]);
    }
    setInput('');
  }

  const onRemoveOption = (option) => {
    addedTopics.splice(addedTopics.indexOf(option), 1);
    setAddedTopics([...addedTopics]);
  }

  const onSubmitAddedOptions = () => {
    const today = new Date();
    const dateString = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`;
    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    gapi.client.request({
      'path': `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet2!A1:D1:append`,
      'method': 'POST',
      'params': {
        'valueInputOption': 'USER_ENTERED',
        'insertDataOption': 'INSERT_ROWS',
      },
      'body': {
        'range': 'Sheet2!A1:D1',
        'values': addedTopics.map((x) => [x, dateString, timeString, userEmail]),
      }
    }).then((res) => {
      if (res.status === 200) {
        setSnackbar('success');
        setAddedTopics([]);
      } else {
        setSnackbar('error');
      }
    });
  }

  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar('');
  }

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      minHeight='100vh'
    >
      <div style={{ maxWidth: '960px' }}>
        <div style={{ display: signedIn ? 'none' : 'block' }}>
          <GoogleLogin
            clientId={clientId}
            buttonText='Sign in with Google'
            onSuccess={onSuccess}
          />
        </div>
        <Grid
          container
          direction='row'
          spacing={6}
          alignItems='center'
          justifyContent='space-evenly'
          sx={{display: signedIn ? 'flex' : 'none' }}
        >
          <Grid container justifyContent='center' item xs={12} md={4}>
            <Autocomplete
              id='topics-dropdown'
              inputValue={input}
              options={dropdownOptions}
              loading={loading}
              onInputChange={(_, newValue) => {
                setInput(newValue);
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue === option);
                if (inputValue !== '' && !isExisting) {
                  filtered.push(`Add new topic "${inputValue}"`);
                }
                return filtered;
              }}
              onOpen={getTopicOptions}
              selectOnFocus
              freeSolo
              handleHomeEndKeys
              renderInput={(params) => <TextField {...params} label='Topic' />}
              renderOption={(props, option) =>
                <li {...props} onClick={() => onSelectOption(option)}> {option} </li>
              }
              sx={{ width: 300 }}
            />
          </Grid>
          <Grid container direction='column' justifyContent='center' item xs={12} md={4}>
            <Typography align='center'>
              Added Topics:
            </Typography>
            <List dense sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {addedTopics.length > 0 ? 
              addedTopics.map((x) => {
                return(
                  <ListItem sx={{ width: 240 }} key={x}>
                    <IconButton
                      edge='end'
                      onClick={() => onRemoveOption(x)}
                    >
                      <CloseIcon />
                    </IconButton>
                    <ListItemText style={{marginLeft: '24px'}} primary={x}/>
                  </ListItem>
                )
              })
              :
              <ListItem sx={{ width: 240 }} key='none-yet'>
                <ListItemText style={{marginLeft: '54px'}} primary='None'/>
              </ListItem>
              }
            </List>
          </Grid>
          <Grid container justifyContent='center' item xs={12} md={3}>
            <Button variant='contained' disabled={addedTopics.length === 0} onClick={onSubmitAddedOptions}>
              Submit Topics
            </Button>
          </Grid>
        </Grid>
      </div>
      <Snackbar open={snackbar !== ''} autoHideDuration={5000} onClose={handleSnackbarClose}>
        {snackbar === 'success' ?
        <Alert onClose={handleSnackbarClose} severity={'success'} variant='filled'>
          <AlertTitle> Success </AlertTitle>
          Topics submitted successfully!
        </Alert>
        :
        <div></div>
        }
      </Snackbar>
    </Box>
  );
}

export default App;