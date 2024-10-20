import React, { useState, useEffect } from 'react';
import { Container, TextField, Typography, Grid, Card, CardContent, CardActions, Button, IconButton, Box, Modal, Fade, Backdrop, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { keyframes } from '@mui/system';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween'; // Import the plugin

dayjs.extend(isBetween); // Extend dayjs to use the plugin

// Expanded receipt data
const receipts = [
  { id: 1, company: 'Amazon', date: '2024-09-15', total: '$150.99', section: 'September', details: 'Purchased: Electronics, Order ID: 123456' },
  { id: 2, company: 'Starbucks', date: '2024-10-18', total: '$5.45', section: 'October', details: 'Purchased: Coffee, Order ID: 654321' },  // Today
  { id: 3, company: 'Walmart', date: '2024-10-17', total: '$75.25', section: 'October', details: 'Purchased: Groceries, Order ID: 987654' },  // Yesterday
  { id: 4, company: 'Target', date: '2024-10-12', total: '$32.10', section: 'October', details: 'Purchased: Clothing, Order ID: 345678' },  // Previous 7 Days
  { id: 5, company: 'Apple', date: '2024-09-22', total: '$199.99', section: 'September', details: 'Purchased: iPhone, Order ID: 456789' },  // Previous 30 Days
  { id: 6, company: 'Best Buy', date: '2024-10-14', total: '$399.99', section: 'October', details: 'Purchased: Laptop, Order ID: 567890' },
  { id: 7, company: 'Uber Eats', date: '2024-10-11', total: '$24.99', section: 'October', details: 'Purchased: Food Delivery, Order ID: 678901' },
  { id: 8, company: 'Spotify', date: '2024-09-01', total: '$9.99', section: 'September', details: 'Purchased: Music Subscription, Order ID: 789012' },
  { id: 9, company: 'Netflix', date: '2024-10-05', total: '$15.99', section: 'October', details: 'Purchased: Subscription, Order ID: 890123' },
  { id: 10, company: 'Google Store', date: '2024-08-25', total: '$249.99', section: 'August', details: 'Purchased: Pixel Buds, Order ID: 901234' },
  { id: 11, company: 'Airbnb', date: '2024-09-30', total: '$500.00', section: 'September', details: 'Purchased: Vacation Rental, Order ID: 012345' },
  { id: 12, company: 'Lyft', date: '2024-10-15', total: '$45.75', section: 'October', details: 'Purchased: Ride, Order ID: 123789' },
  { id: 13, company: 'McDonalds', date: '2024-09-29', total: '$12.50', section: 'September', details: 'Purchased: Fast Food, Order ID: 345678' },
  { id: 14, company: 'CVS Pharmacy', date: '2024-09-12', total: '$22.99', section: 'September', details: 'Purchased: Medicine, Order ID: 456789' },
  { id: 15, company: 'Nike', date: '2024-09-18', total: '$99.99', section: 'September', details: 'Purchased: Shoes, Order ID: 567890' },
  { id: 16, company: 'Apple Music', date: '2024-10-10', total: '$9.99', section: 'October', details: 'Purchased: Music Subscription, Order ID: 678901' },
  { id: 17, company: 'Costco', date: '2024-10-16', total: '$120.99', section: 'October', details: 'Purchased: Groceries, Order ID: 789012' },
  { id: 18, company: 'eBay', date: '2024-08-29', total: '$75.50', section: 'August', details: 'Purchased: Electronics, Order ID: 890123' },
  { id: 19, company: 'Adidas', date: '2024-10-06', total: '$79.99', section: 'October', details: 'Purchased: Apparel, Order ID: 901234' },
  { id: 20, company: 'Whole Foods', date: '2024-09-27', total: '$45.00', section: 'September', details: 'Purchased: Groceries, Order ID: 012345' }
];

// Define keyframes for background animation
const moveGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Date-related calculations
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const previous7Days = dayjs().subtract(7, 'day');
  const previous30Days = dayjs().subtract(30, 'day');

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.documentElement.style.width = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.company.toLowerCase().includes(searchQuery) || 
    receipt.date.includes(searchQuery)
  );

  const sections = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'October', 'September', 'August'];

  const filterReceiptsByDateRange = (range) => {
    if (range === 'Today') {
      return filteredReceipts.filter(receipt => receipt.date === today);
    }
    if (range === 'Yesterday') {
      return filteredReceipts.filter(receipt => receipt.date === yesterday);
    }
    if (range === 'Previous 7 Days') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isBetween(previous7Days, today, null, '[)'));
    }
    if (range === 'Previous 30 Days') {
      return filteredReceipts.filter(receipt => dayjs(receipt.date).isBetween(previous30Days, previous7Days, null, '[)'));
    }
    return filteredReceipts.filter(receipt => receipt.section === range);
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
      {/* Extended Header with animated gradient */}
      <Box sx={{
        position: 'relative',
        padding: '100px 0',
        width: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #001F3F, #003366, #001F3F)',  // Darker blue gradient
        backgroundSize: '200% 200%',
        animation: `${moveGradient} 6s ease infinite`,
        clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}>
          <Typography variant="h1" sx={{ fontWeight: '500', color: '#F0FFFF', marginBottom: '10px' }}>
            Receiptly
          </Typography>
          <Typography variant="h5" sx={{ color: '#F0FFFF', marginBottom: '20px' }}>
            All your receipts in one place.
          </Typography>
          <TextField
            label="Find your receipt here"
            variant="outlined"
            size="medium"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Find your receipt here"
            InputProps={{
              endAdornment: (
                <IconButton>
                  <SearchIcon sx={{ color: '#003366' }} />
                </IconButton>
              ),
            }}
            sx={{
              width: '70%',
              backgroundColor: 'white',
              borderRadius: '50px',  // Rounded corners
              border: '2px solid #72A0C1',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#72A0C1',
                },
                '&:hover fieldset': {
                  borderColor: '#003366',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#003366',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none', // Removes the outline when not focused
              }
            }}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Container sx={{ marginTop: '20px', maxWidth: '100%', paddingLeft: '20px', marginLeft: '0px' }}>  
        {sections.map((section) => (
          <Box key={section} sx={{ marginBottom: '40px', alignItems: 'flex-start' }}>
            <Typography 
              variant="h5"  // Changed from "h4" to "h5" for a smaller size
              sx={{ fontWeight: '700', color: '#003366', marginBottom: '10px', fontFamily: 'Poppins, sans-serif' }}>
              {section} Receipts
            </Typography>
            <Divider sx={{ backgroundColor: '#72A0C1', height: '2px', marginBottom: '20px' }} />
            <Grid container spacing={4}>
              {filterReceiptsByDateRange(section).map((receipt) => (
                <Grid item xs={12} sm={6} md={4} key={receipt.id}>
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
                        {receipt.company}
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
        BackdropProps={{
          timeout: 500,
        }}
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
                  {selectedReceipt.company} - {selectedReceipt.date}
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: '10px', color: '#003366' }}>
                  Total: {selectedReceipt.total}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedReceipt.details}
                </Typography>
                <Button
                  onClick={handleCloseModal}
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
                  Close
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Footer */}
      <footer style={{ backgroundColor: '#003366', color: '#F0FFFF', padding: '16px', textAlign: 'center', width: '100%', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }}>
        © 2024 Receiptly. All Rights Reserved.
      </footer>
    </div>
  );
}

export default App;
