import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class AnswerMail {
  get key() {
    return 'AnswerMail';
  }

  async handle({ data }) {
    const { student, question, answer, answer_at } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Pedido de auxílio respondido',
      template: 'answer',
      context: {
        student: student.name,
        question,
        answer,
        answer_at: format(parseISO(answer_at), 'dd/MM/yyyy HH:mm', {
          locale: pt,
        }),
      },
    });
  }
}

export default new AnswerMail();
