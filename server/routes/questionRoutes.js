const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const {
  getQuestions,
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  importQuestionsJson,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');
const validateQuestion = require('../middleware/validateQuestion');

router.use(protect);

router.post(
  '/import-json',
  authorize('faculty', 'admin'),
  upload.single('file'),
  importQuestionsJson
);

router.route('/')
  .get(authorize('faculty', 'admin'), getQuestions)
  .post(authorize('faculty', 'admin'), validateQuestion(true), createQuestion);

router.route('/:id')
  .get(authorize('faculty', 'admin'), getQuestionById)
  .put(authorize('faculty', 'admin'), validateQuestion(), updateQuestion)
  .delete(authorize('faculty', 'admin'), deleteQuestion);

module.exports = router;
