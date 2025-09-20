require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express(); 

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });

app.use('/api/auth', require('./routes/auth')); // make sure routes/auth.js exists in src_backend
app.use("/api/agents", require("./routes/agents"));
app.use("/api/chat", require("./routes/chat"));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use("/api/chat", require("./routes/chat"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
