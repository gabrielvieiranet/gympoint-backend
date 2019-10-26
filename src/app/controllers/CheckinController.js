import { startOfDay, endOfDay, subDays } from 'date-fns';
import { Op } from 'sequelize';

import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.id,
      },
      order: [['created_at', 'DESC']],
    });

    return res.json(checkins);
  }

  async store(req, res) {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const verifyCheckinToday = await Checkin.findAll({
      where: {
        student_id: req.params.id,
        createdAt: {
          [Op.between]: [startOfDay(new Date()), endOfDay(new Date())],
        },
      },
    });

    if (verifyCheckinToday.length > 0) {
      return res
        .status(401)
        .json({ error: "There's already a checkin for today" });
    }

    const verifyCheckinMax = await Checkin.findAll({
      where: {
        student_id: req.params.id,
        createdAt: {
          [Op.between]: [
            subDays(startOfDay(new Date()), 6),
            endOfDay(new Date()),
          ],
        },
      },
    });

    if (verifyCheckinMax.length > 4) {
      return res.status(401).json({
        error: "You've reached the checkins limit for the last 7 days",
      });
    }

    const checkin = await Checkin.create({
      student_id: req.params.id,
    });

    return res.json(checkin);
  }
}

export default new CheckinController();
