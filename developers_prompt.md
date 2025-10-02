Developing Prompt

<context>
- Currently, editing a project does not cause for a new project to be created at supabase storage = projects
- This is the intended behaviour and needs to be kept that way.
- Currently, project edit form does not include options for uploading markdowns, images and thumbnails
</context>

<build_process>
- Plan steps to implement this build taking
- Plan testing steps once this build is complete
- Execute code changes or actions needed to achieve <build_objective>
- Do not add, commit or push git unless prompted 
</build_process>

<build_objective>
- Include upload bottom for markdown, thumbnail . Review upload_options.png as reference
- This bottoms should be between basic information and the content editor
- make sure that updating the supabase project following the logic: 
if user changes project title: 
- Create new project at the projects storage
- migrate current files from existing project to new project folder 
- replace  (upset) or add the markdown, images or thumbnails the user wants to replace or add 
If user doesnt change project title:
- replace  (upset) or add the markdown, images or thumbnails the user wants to replace or add 
</build_objective>

<developing>
- Based on the <context> read any relevant code related to it unless there is no relevant context
- Execute <build_process> to  achieve <build_objective>
</developing>

Start <developing>

Update Developer Plan Prompt
