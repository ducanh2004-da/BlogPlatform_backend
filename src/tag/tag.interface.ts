import { TagReponse } from 'src/common/models/tag/tag.response';
import { TagReturn, CreateTag, UpdateTag } from 'src/common/models/tag/tag.model';
export interface ITagService {
    getAllTags(): Promise<TagReponse>
    getTagById(id: string): Promise<TagReponse>
    createTag(data: CreateTag): Promise<TagReponse>
    updateTag(id: string, data: UpdateTag): Promise<TagReponse>
    deleteTag(id: string): Promise<TagReponse>
}
export const TAG_TOKEN = 'ITagService';