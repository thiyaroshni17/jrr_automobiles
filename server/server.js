const express = require('express');
const app = express();
require('dotenv').config();
const {connectDB} = require('./database/db.js');
const cors = require('cors');
const cookieparser = require('cookie-parser');
const Router = require('./routes/userroutes.js');



connectDB();
const PORT = process.env.PORT || 5000;

app.use(express.json())
app.use(cors({origin: [process.env.FRONTEND_URL] , credentials:true}))
app.use(cookieparser())
app.use('/jrr',Router)
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
