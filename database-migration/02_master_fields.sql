-- Create master_fields table to store all evaluation indicators
-- This represents the evaluation criteria form with 22 indicators

-- Drop existing objects if needed
DROP TABLE IF EXISTS master_fields CASCADE;
DROP VIEW IF EXISTS master_fields_grouped CASCADE;
DROP FUNCTION IF EXISTS get_indicators_by_level CASCADE;
DROP FUNCTION IF EXISTS search_indicators CASCADE;

-- Create master fields table for evaluation indicators
CREATE TABLE master_fields (
    field_id SERIAL PRIMARY KEY,
    indicator_sequence INTEGER NOT NULL,
    indicator_main VARCHAR(100) NOT NULL,
    indicator_main_en VARCHAR(200) NOT NULL,
    indicator_sub TEXT NOT NULL,
    indicator_sub_en TEXT NOT NULL,
    evaluation_level INTEGER NOT NULL CHECK (evaluation_level BETWEEN 1 AND 3),
    scoring_options JSONB DEFAULT '{"yes": true, "some_practice": true, "no": true}',
    ai_context TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_sequence UNIQUE (indicator_sequence)
);

-- Create indexes for better performance
CREATE INDEX idx_master_fields_level ON master_fields(evaluation_level);
CREATE INDEX idx_master_fields_main ON master_fields(indicator_main);
CREATE INDEX idx_master_fields_active ON master_fields(is_active);
CREATE INDEX idx_master_fields_sequence ON master_fields(indicator_sequence);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_master_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER trigger_update_master_fields_updated_at 
    BEFORE UPDATE ON master_fields 
    FOR EACH ROW 
    EXECUTE FUNCTION update_master_fields_updated_at();

-- Insert all 22 evaluation indicators
INSERT INTO master_fields (
    indicator_sequence, 
    indicator_main, 
    indicator_main_en, 
    indicator_sub, 
    indicator_sub_en, 
    evaluation_level,
    ai_context
) VALUES 
-- LEVEL 1 INDICATORS (Basic)
(1, '១ ខ្លឹមសារ', '1 Content', '១.ខ្លឹមសារមេរៀនស្របតាមបំណែងចែកកម្មវិធីសិក្សា', '1. Lesson content in accordance with the curriculum division', 1, 
'Evaluates whether the teacher follows the official curriculum structure and covers required content systematically. Look for alignment with learning standards and proper sequencing.'),

(2, '១ ខ្លឹមសារ', '1 Content', '២.មានចំណេះសឹងច្បាស់លាស់លើខ្លឹមសារមេរៀនកំពុងងបង្រៀន', '2. Have a clear knowledge of the content of the lesson being taught', 1, 
'Assesses teacher''s subject matter expertise and confidence in delivering content. Look for accurate information, clear explanations, and ability to answer student questions.'),

(3, '២ សម្ភារឧបទេស', '2 Materials', '៣.ប្រើប្រាស់សម្ភារៈរៀននិងបង្រៀនតាមលំដាប់លំដោយនៃខ្លឹមសារមេរៀន', '3. Use learning and teaching materials in the order of the lesson content', 1, 
'Evaluates systematic use of teaching materials that support lesson progression. Materials should enhance understanding and be used at appropriate times.'),

(4, '២ សម្ភារឧបទេស', '2 Materials', '៤.សម្ភារៈមានលក្ខណបច្ចេកទេស ងាយៗ និងអាចរកបាននៅក្នុងសហគមន៌', '4. Materials are technically easy and available in the community', 1, 
'Assesses use of locally available, practical materials that students can relate to and access. Emphasizes resourcefulness and cultural relevance.'),

(5, '២ សម្ភារឧបទេស', '2 Materials', '៥.សិស្សបានប្រើប្រាស់សម្ភារ:ក្នុងសកម្មភារៀន', '5. Students use materials in learning activities', 1, 
'Evaluates student engagement with learning materials through hands-on activities. Students should actively manipulate and interact with materials.'),

-- LEVEL 2 INDICATORS (Intermediate)
(6, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '៦.អនុវត្តសកម្មភាពភ្ជាប់ទំនាក់ទំងរវាងមេរៀននមុន និងមេរៀនថ្មី', '6. Perform activities to connect the previous lesson with the new lesson', 2, 
'Assesses how effectively teacher bridges prior knowledge with new content. Look for review activities, questioning about previous lessons, and clear connections.'),

(7, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '៧.បង្រៀនមានលំដាប់លំដោយស្របតាមខ្លឺមសារមេរៀន', '7. Teach in order according to the content of the lesson', 2, 
'Evaluates logical sequencing of instruction that builds understanding progressively. Content should flow from simple to complex concepts.'),

(8, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '៨.កសាងបញ្ញត្តិផ្តើមពីរូបី ទៅពាក់កណ្តាលរូបី/ពាក់កណ្តាលអរូបី​ ទៅអរូបី', '8. Build regulations from tangible to semi-tangible / semi-abstract to abstract', 2, 
'Assesses progression from concrete manipulatives to abstract concepts. Essential for mathematics and science learning, moving from hands-on to conceptual understanding.'),

(9, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '៩.មានបញ្ចូលល្បែងសិក្សា ឬចម្រៀងង', '9. Includes educational games or songs', 2, 
'Evaluates use of engaging, age-appropriate activities that make learning enjoyable. Games and songs should reinforce learning objectives.'),

(10, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១០.លើកទឹកចិត្តសិស្សឪ្យអនុវត្តសកម្មភាពពរៀនសូត្របែបចូលរួមដូចជា ការងារបុគ្គល ដៃគូ ក្រុម', '10. Encourage students to practice participatory learning activities such as individual work, team partners', 2, 
'Assesses variety in learning modalities - individual reflection, pair work, and group collaboration. Students should be actively engaged, not passive recipients.'),

(11, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១១.អន្តរកម្មសកម្ម បែបវិជ្ជមាន រវាងគ្រូនិងងសិស្ស សិស្សនិងសិស្ស', '11. Positive interaction between teachers and students, students and students', 2, 
'Evaluates classroom climate and communication patterns. Look for respectful dialogue, encouragement, and collaborative learning environment.'),

(12, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១២.រៀបចំអង្គុយសិស្សបានសមស្រប ប្រកបដោយបរយាបន្ន', '12. Arrange for students to sit properly and comfortably', 2, 
'Assesses classroom management and physical learning environment. Seating should facilitate learning activities and student interaction.'),

(13, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៣.ពិនិត្យចំណេះដឹងរបស់សិស្សតាមរយ:ការសួរសំណួរ ឬសិស្សធ្វើលំហាត់', '13. Examine students'' knowledge by asking questions or doing homework', 2, 
'Evaluates formative assessment techniques during instruction. Teacher should check understanding frequently through questioning and practice activities.'),

-- LEVEL 3 INDICATORS (Advanced)
(14, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៤.ខ្លឹមសារមេរៀនផ្សាភ្ជាប់នឹងបទពិសោធ និងជីវភាពរស់នៅ', '14. Lesson content related to experience and life', 3, 
'Assesses relevance and connection to students'' daily experiences. Learning should be meaningful and applicable to their lives and cultural context.'),

(15, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៥.ចល័តប្រចាំក្នុងថ្នាក់រៀន ដើម្បីពន្យល់ ជួយសិស្សរៀនយឺត និងសិស្សមានតម្រូវការពិសេស', '15. Mobile in the classroom to explain to help students learn slowly and students with special needs', 3, 
'Evaluates differentiated instruction and individual attention. Teacher should circulate, provide targeted support, and address diverse learning needs.'),

(16, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៦.បែងចែកក្រុមតាមវិធីជាក់លាក់ និងសម្របសម្រួលកិច្ចការក្រុម', '16. Divide the group into specific ways and coordinate group work', 3, 
'Assesses strategic grouping and collaborative learning facilitation. Groups should be purposeful with clear roles and teacher guidance.'),

(17, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៧.ប្រើប្រាស់កកម្រិតសំណួរ', '17. Use question level', 3, 
'Evaluates use of Bloom''s taxonomy or varied question types - recall, comprehension, application, analysis. Questions should promote higher-order thinking.'),

(18, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៨.គ្រប់គ្រងងពេលវេលាតាមសកម្មភាពបបានល្អ', '18. Manage time according to activities well', 3, 
'Assesses efficient lesson pacing and time allocation. Activities should have appropriate duration with smooth transitions between segments.'),

(19, '៣ សកម្មភាពរៀន និងបង្រៀន', '3 Learning and teaching activities', '១៩.ប្រើប្រាស់បច្ចេកវិទ្យា តាមការច្នៃប្រឌិតរបស់គ្រូ', '19. Use technology according to the teacher''s creativity', 3, 
'Evaluates innovative and appropriate technology integration. Technology should enhance learning, not just be present for its own sake.'),

(20, '៤ ការវាយតម្លៃ', '4 Evaluation', '២០.សង្កេត កត់ត្រាលទ្ធផល កំណត់សិស្សរៀនយឺត និងសិស្សមានតម្រូវការពិសេស ដើម្បីជួយសិស្សទាន់ពេលវេលា', '20. Observe and record the results of students who are late and students with special needs to help students on time', 3, 
'Assesses systematic tracking of struggling learners and timely intervention. Teacher should identify learning gaps and provide immediate support.'),

(21, '៤ ការវាយតម្លៃ', '4 Evaluation', '២១.ផ្តល់កិច្ចការសមស្របតាមកម្រិតសមត្ថភាពសិស្ស', '21. Provide appropriate assignments according to the student''s ability level', 3, 
'Evaluates differentiated assignments that match individual student capabilities. Tasks should challenge without overwhelming learners.'),

(22, '៤ ការវាយតម្លៃ', '4 Evaluation', '២២.ត្រៀមកិច្ចការបន្ថែមសម្រាប់សិស្សពូកែឬកញ្ចប់កិច្ចការមុនម៉ោងកំណត់', '22. Prepare extra work for outstanding students or assignments before the deadline', 3, 
'Assesses provision for advanced learners and early finishers. Additional challenges should extend learning rather than just keep students busy.');

-- Create a view to easily query indicators by main category
CREATE VIEW master_fields_grouped AS
SELECT 
    indicator_main,
    indicator_main_en,
    evaluation_level,
    COUNT(*) as sub_indicator_count,
    json_agg(
        json_build_object(
            'sequence', indicator_sequence,
            'sub_indicator_km', indicator_sub,
            'sub_indicator_en', indicator_sub_en,
            'ai_context', ai_context
        ) ORDER BY indicator_sequence
    ) as sub_indicators
FROM master_fields 
WHERE is_active = true
GROUP BY indicator_main, indicator_main_en, evaluation_level
ORDER BY MIN(indicator_sequence);

-- Create function to get indicators by evaluation level
CREATE OR REPLACE FUNCTION get_indicators_by_level(p_level INTEGER)
RETURNS TABLE (
    field_id INTEGER,
    sequence INTEGER,
    main_indicator_km VARCHAR(100),
    main_indicator_en VARCHAR(200),
    sub_indicator_km TEXT,
    sub_indicator_en TEXT,
    ai_context TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mf.field_id,
        mf.indicator_sequence,
        mf.indicator_main,
        mf.indicator_main_en,
        mf.indicator_sub,
        mf.indicator_sub_en,
        mf.ai_context
    FROM master_fields mf
    WHERE mf.evaluation_level = p_level 
      AND mf.is_active = true
    ORDER BY mf.indicator_sequence;
END;
$$ LANGUAGE plpgsql;

-- Create function to search indicators
CREATE OR REPLACE FUNCTION search_indicators(p_search_term TEXT)
RETURNS TABLE (
    field_id INTEGER,
    sequence INTEGER,
    main_indicator_km VARCHAR(100),
    main_indicator_en VARCHAR(200),
    sub_indicator_km TEXT,
    sub_indicator_en TEXT,
    evaluation_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mf.field_id,
        mf.indicator_sequence,
        mf.indicator_main,
        mf.indicator_main_en,
        mf.indicator_sub,
        mf.indicator_sub_en,
        mf.evaluation_level
    FROM master_fields mf
    WHERE mf.is_active = true
      AND (
        mf.indicator_main ILIKE '%' || p_search_term || '%' OR
        mf.indicator_main_en ILIKE '%' || p_search_term || '%' OR
        mf.indicator_sub ILIKE '%' || p_search_term || '%' OR
        mf.indicator_sub_en ILIKE '%' || p_search_term || '%'
      )
    ORDER BY mf.indicator_sequence;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE master_fields IS 'Master table storing all 22 evaluation indicators/criteria';
COMMENT ON COLUMN master_fields.evaluation_level IS 'Evaluation complexity level: 1=Basic, 2=Intermediate, 3=Advanced';
COMMENT ON COLUMN master_fields.scoring_options IS 'Available scoring options for this indicator (yes/some practice/no)';
COMMENT ON COLUMN master_fields.ai_context IS 'Context information for AI-powered evaluation assistance';