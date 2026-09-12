import { supabase } from '../src/lib/supabase';

async function probe() {
  console.log('Probing Supabase...');
  try {
    const res = await supabase.from('man_of_the_match_nominations').select('count', { count: 'exact', head: true });
    console.log('Query result:', res);
  } catch (err) {
    console.error('Query caught error:', err);
  }
  process.exit(0);
}

probe();
