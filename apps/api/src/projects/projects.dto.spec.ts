import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto.js';

describe('адрес репозитория проекта', () => {
  it('принимает HTTP(S)-ссылку при создании и позволяет очистить её при обновлении', async () => {
    const create = Object.assign(new CreateProjectDto(), {
      slug: 'hsse', name: 'ВШПИ', repositoryUrl: 'https://git.crito-dev.it-edu.com/mfti/hsse',
    });
    expect(await validate(create)).toEqual([]);
    expect(await validate(Object.assign(new UpdateProjectDto(), { repositoryUrl: '' }))).toEqual([]);
  });

  it.each(['javascript:alert(1)', 'https://user:secret@git.example.ru/repo', 'https://git.example.ru/repo?token=secret'])('отклоняет небезопасный адрес %s', async (repositoryUrl) => {
    const dto = Object.assign(new CreateProjectDto(), { slug: 'hsse', name: 'ВШПИ', repositoryUrl });
    expect(await validate(dto)).not.toEqual([]);
  });
});
