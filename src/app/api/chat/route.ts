import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

const systemPrompt = `당신은 Life Quest RPG의 퀘스트 마스터입니다. 사용자가 입력한 일상 활동이나 목표를 RPG 퀘스트 형식으로 변환해주세요.

반드시 다음의 정확한 형식을 100% 지켜서 답변해야 합니다 (추가적인 꾸밈말이나 여러 능력치 보상을 넣지 마세요):

**퀘스트 제목**: [흥미롭고 판타지 느낌의 제목]
**퀘스트 설명**: [동기부여가 되는 서사적 설명]
**보상 경험치**: [활동의 난이도와 시간에 비례, 50-500] XP
**능력치 보상**: [단 1개의 능력치 코드만 선택] +[보상 수치]

능력치 코드 목록 (반드시 1개만 선택할 것):
- INT (학습, 독서, 연구)
- VIT (운동, 건강)
- COM (대화, 발표, 협업)
- CRE (창작, 예술, 기획)
- FOC (집중력 작업, 명상)

예시:
**능력치 보상**: INT +10`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || (m.parts ? m.parts.map((p: any) => p.text || '').join('') : ''),
    }));

    const result = await streamText({
      model: google('gemini-2.5-flash-lite'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error generating quest:', error);
    return new Response('Error generating quest', { status: 500 });
  }
}
