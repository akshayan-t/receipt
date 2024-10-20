import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Modal, Fade, Backdrop, Divider } from '@mui/material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receipts, setReceipts] = useState([]);

  // Date-related calculations
  const today = dayjs().startOf('day'); // Today's start
  const yesterday = dayjs().subtract(1, 'day').startOf('day');
  const previous7Days = dayjs().subtract(7, 'day').startOf('day');
  const previous30Days = dayjs().subtract(30, 'day').startOf('day');

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await axios.get('/api/receipts');
        const sortedReceipts = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));  // Sort by date in descending order
        console.log("Sorted receipts: ", sortedReceipts);
        setReceipts(sortedReceipts);
      } catch (error) {
        console.error("There was an error fetching the receipts!", error);
      }
    };
  
    fetchReceipts();
  }, []);
  

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.sender_name?.toLowerCase().includes(searchQuery) || 
    receipt.date.includes(searchQuery)
  );

  // Simplified sections (add more if necessary)
  const sections = [
    'Today', 
    'Yesterday', 
    'Previous 7 Days', 
    'Previous 30 Days',
    'Older than 30 Days'
  ];

  const filterReceiptsBySection = (section) => {
    if (section === 'Today') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isSame(today, 'day'));
    }
    if (section === 'Yesterday') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isSame(yesterday, 'day'));
    }
    if (section === 'Previous 7 Days') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isBetween(previous7Days, today, null, '[)'));
    }
    if (section === 'Previous 30 Days') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isBetween(previous30Days, previous7Days, null, '[)'));
    }
    // Everything older than 30 days
    if (section === 'Older than 30 Days') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isBefore(previous30Days));
    }
    return [];
  };

  const handleOpenModal = (receipt) => {
    setSelectedReceipt(receipt);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <div className="app" style={{ width: '100%', backgroundColor: '#F0FFFF' }}>
      <Box sx={{ padding: '100px 0', backgroundColor: '#003366', color: '#F0FFFF' }}>
        <Typography variant="h1" sx={{ textAlign: 'center' }}>Receiptly</Typography>
        <Typography variant="h5" sx={{ textAlign: 'center' }}>All your receipts in one place.</Typography>
      </Box>

      {/* Main Content */}
      <Container sx={{ marginTop: '20px', maxWidth: '100%', paddingLeft: '20px' }}>
        {sections.map((section) => (
          <Box key={section} sx={{ marginBottom: '40px', alignItems: 'flex-start' }}>
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#003366', marginBottom: '10px' }}>
              {section} Receipts
            </Typography>
            <Divider sx={{ backgroundColor: '#72A0C1', height: '2px', marginBottom: '20px' }} />
            <Grid container spacing={4}>
              {filterReceiptsBySection(section).map((receipt, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      backgroundColor: '#E0F7FA',
                      borderRadius: '20px',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
                      },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#003366', fontWeight: 'bold' }}>
                        {receipt.sender_name} ({receipt.sender_email})
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {receipt.date}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'green', marginTop: '10px' }}>
                        {receipt.total}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        sx={{
                          background: 'linear-gradient(45deg, #72A0C1, #003366)',
                          color: 'white',
                          borderRadius: '20px',
                          padding: '5px 20px',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #003366, #72A0C1)',
                            transform: 'scale(1.05)',
                          },
                        }}
                        onClick={() => handleOpenModal(receipt)}
                      >
                        View Receipt
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Container>

      {/* Modal for showing full receipt details */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              backgroundColor: '#F0FFFF',
              padding: '20px',
              boxShadow: '24px',
              borderRadius: '8px',
              outline: 'none',
            }}
          >
            {selectedReceipt && (
              <>
                <Typography variant="h6" sx={{ marginBottom: '10px', color: '#003366' }}>
                  {selectedReceipt.sender_name} - {selectedReceipt.date}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: '10px', color: '#003366' }}>
                  Total: {selectedReceipt.total}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedReceipt.snippet}
                </Typography>
                <Button
                  component="a"
                  href={selectedReceipt.receipt_link}
                  target="_blank"
                  sx={{
                    marginTop: '20px',
                    background: 'linear-gradient(45deg, #72A0C1, #003366)',
                    color: 'white',
                    borderRadius: '20px',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #003366, #72A0C1)',
                      transform: 'scale(1.05)',
                    },
                  }}
                  variant="contained"
                >
                  Open in Gmail
                </Button>
                <Button
                  onClick={handleCloseModal}
                  sx={{
                    marginTop: '10px',
                    background: 'linear-gradient(45deg, #72A0C1, #003366)',
                    color: 'white',
                    borderRadius: '20px',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #003366, #72A0C1)',
                      transform: 'scale(1.05)',
                    },
                  }}
                  variant="contained"
                >
                  Close
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Footer */}
      <footer style={{ backgroundColor: '#003366', color: '#F0FFFF', padding: '16px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        © 2024 Receiptly. All Rights Reserved.
      </footer>
    </div>
  );
}

export default App;
