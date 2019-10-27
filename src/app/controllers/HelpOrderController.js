import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';
import User from '../models/User';

import AnswerMail from '../jobs/AnswerMail';
import Queue from '../../lib/Queue';

import Notification from '../schemas/Notification';

class HelpOrderController {
  async index(req, res) {
    const { id: student_id } = req.params;

    if (student_id) {
      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(400).json({ error: 'Invalid student' });
      }

      const helpOrders = await HelpOrder.findAll({
        where: {
          student_id,
        },
        attributes: ['id', 'question', 'answer', 'answer_at', 'createdAt'],
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'name'],
          },
        ],
      });

      return res.json(helpOrders);
    }

    const helpOrdersWithoutAnswer = await HelpOrder.findAll({
      where: {
        answer_at: null,
      },
      attributes: ['id', 'question', 'createdAt'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(helpOrdersWithoutAnswer);
  }

  async store(req, res) {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Validation fail' });
    }

    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(400).json({ error: 'Invalid student' });
    }

    const helpOrder = await HelpOrder.create({
      student_id: req.params.id,
      question,
    });

    const { id } = helpOrder;
    const { id: student_id, name } = student;

    /**
     * Notify admin users
     */
    const users = await User.findAll();
    users.forEach(async user => {
      await Notification.create({
        content: `Novo pedido de auxílio de ${name}`,
        user: user.id,
      });
    });

    return res.json({
      id,
      question,
      student: {
        id: student_id,
        name,
      },
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { answer } = req.body;

    const helpOrder = await HelpOrder.findByPk(req.params.id, {
      attributes: ['id', 'question', 'createdAt'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!helpOrder) {
      return res.status(401).json({ error: 'Invalid help order' });
    }

    const answer_at = new Date();

    await helpOrder.update({
      answer,
      answer_at,
    });

    const { student, question } = helpOrder;

    /**
     * Send email to notify the student
     */
    await Queue.add(AnswerMail.key, {
      student,
      question,
      answer,
      answer_at,
    });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
