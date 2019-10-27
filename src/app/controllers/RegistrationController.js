import * as Yup from 'yup';
import { startOfDay, addMonths } from 'date-fns';
import Registration from '../models/Registration';
import Student from '../models/Student';
import Plan from '../models/Plan';

import RegistrationMail from '../jobs/RegistrationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll();

    return res.json(registrations);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id } = req.body;

    /**
     * Check if student exists
     */
    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    /**
     * Check if plan exists
     */
    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(401).json({ error: 'Plan not found' });
    }

    const start_date = startOfDay(new Date());
    const end_date = addMonths(start_date, plan.duration);
    const price = plan.duration * plan.price;

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    const formatedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);

    /**
     * Send email to notify the student
     */
    await Queue.add(RegistrationMail.key, {
      student,
      plan,
      start_date,
      end_date,
      formatedPrice,
    });

    return res.json({
      id: registration.id,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      plan: {
        id: plan.id,
        title: plan.title,
      },
      start_date,
      end_date,
      price,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, student_id, plan_id } = req.body;

    /**
     * Check if registration exists
     */
    const registration = await Registration.findByPk(id);

    if (!registration) {
      return res.status(401).json({ error: 'Registration not found' });
    }

    /**
     * Check if student exists
     */
    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    /**
     * Check if plan exists
     */
    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(401).json({ error: 'Plan not found' });
    }

    const start_date = startOfDay(new Date());
    const end_date = addMonths(start_date, plan.duration);
    const price = plan.duration * plan.price;

    await registration.update({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    return res.json({
      id: registration.id,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      plan: {
        id: plan.id,
        title: plan.title,
      },
      start_date,
      end_date,
      price,
    });
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id);

    if (!registration) {
      return res.status(401).json({ error: 'Registration not found' });
    }

    await registration.destroy();

    return res.json();
  }
}

export default new RegistrationController();
