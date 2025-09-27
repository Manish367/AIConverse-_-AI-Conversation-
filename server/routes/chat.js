const express = require('express');
const { chat, compare, listConversations, getConversation, renameConversation, deleteConversation } = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();
router.post('/', auth, chat);
router.post('/compare', auth, compare);
router.get('/history', auth, listConversations);
router.get('/:id', auth, getConversation);
router.patch('/:id/title', auth, renameConversation);
router.delete('/:id', auth, deleteConversation);

module.exports = router;