import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID;
export const ADMIN_SUPABASE_EMAIL = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_EMAIL;


export const Scoring_Criteria = [
    {
        key: 'Introduction',
        label: 'Introduction',
        description: 'Clarity of problem statement, motivation, and objectives.',
        maxScore: 5,
    },
    {
        key: 'Objectives',
        label: 'Objectives',
        description: 'Clarity and feasibility of stated objectives.',
        maxScore: 10,
    },
    {
        key: 'Implementation',
        label: 'Implementation',
        description: 'Effectiveness and creativity of the proposed solution.',
        maxScore: 15,
    },
    {
        key: 'Results',
        label: 'Results',
        description: 'Quality and significance of results, including data analysis.',
        maxScore: 10,
    },
    {
        key: 'Conclusion',
        label: 'Conclusion',
        description: 'Strength of conclusions and future work suggestions.',
        maxScore: 5,
    },
    {
        key: 'Implication',
        label: 'Implication',
        description: 'Potential impact and real-world applicability of the solution.',
        maxScore: 10,
    }
]

export const Total_Max_Score = Scoring_Criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);