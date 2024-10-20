// src/Login.js
import React from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const Login = () => {
  return (
    <Container maxWidth="sm" className="bg-white shadow-lg p-10 rounded-lg mt-20">
      <Typography variant="h4" component="h1" className="text-center mb-6 text-green-600">
        Receiply
      </Typography>
      <Typography variant="subtitle1" component="p" className="text-center mb-6 text-gray-500">
        Receipt Organization App
      </Typography>
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <TextField 
          label="Email" 
          variant="outlined" 
          fullWidth 
          required 
          className="rounded-lg border border-gray-300"
        />
        <TextField 
          label="Password" 
          variant="outlined" 
          type="password" 
          fullWidth 
          required 
          className="rounded-lg border border-gray-300"
        />
        <Button 
          variant="contained" 
          color="primary" 
          type="submit" 
          fullWidth 
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Log In
        </Button>
      </Box>
    </Container>
  );
};

export default Login;
