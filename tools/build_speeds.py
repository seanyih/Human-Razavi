"""Write tools/model_speeds.json: output speed (tok/s) + base latency per Razavi-Bench model.

basis:
  measured - Artificial Analysis leaderboard, same model, closest reasoning-effort variant
  web      - figure found in a web search (source URL recorded)
  proxy    - no public figure; borrowed from the nearest sibling model (named in note)
"""
import json, sys
aa = json.load(open(sys.argv[1]))          # parsed AA leaderboard: {variant name: {...}}
idx = json.load(open(sys.argv[2]))         # Razavi-Bench index.json
out_path = sys.argv[3]
AA_URL = 'https://artificialanalysis.ai/leaderboards/models'
SNAP = '2026-11-27'

def aa_pick(release, effort):
    vs = {k: v for k, v in aa.items() if v['release'] == release}
    if not vs:
        raise SystemExit('no AA release ' + release)
    order = {
        'max': ['Max', 'Xhigh', 'High', 'Reasoning'], 'xhigh': ['Xhigh', 'Max', 'High', 'Reasoning'], 'high': ['High', 'Xhigh', 'Max', 'Medium', 'Reasoning'],
        'thinking': ['Reasoning', 'Max', 'Xhigh', 'High'], 'default': ['Non-reasoning'],
    }.get(effort, ['High'])
    for suf in order:
        for k, v in vs.items():
            if k.startswith(release + ' (' + suf):
                return k, v
    k = sorted(vs)[0]
    return k, vs[k]

def min_ttft(release):
    xs = [v['ttft'] for v in aa.values() if v['release'] == release and v['ttft'] is not None]
    return min(min(xs), 10.0) if xs else None  # cap: a long TTFT is thinking time, already counted in tokens

MEASURED = {
    'gemini_4_carbon': 'Gemini 4 Carbon', 'claude_opus_55': 'Claude Opus 5.5', 'claude_fable_52': 'Claude Fable 5.2',
    'gemini_4_argon': 'Gemini 4 Argon', 'hy4': 'Tencent Hy4', 'muse_wonder_full_10': 'Muse Wonder',
    'kimi_31_pro': 'Kimi K3.1 Pro', 'gpt_53': 'GPT-5.3 Codex', 'claude_haiku_55': 'Claude Haiku 5.5',
    'glm_5_3_flash_260828_max': 'GLM-5.3-Flash', 'gemini_31': 'Gemini 3.1 Pro Preview',
    'deepseek_v41_flash_1017': 'DeepSeek V4.1 Flash 1017', 'gpt_6_luna': 'GPT-6 Luna',
    'minimax_m31_flash': 'MiniMax-M3.1-Flash', 'minimax_m3': 'MiniMax-M3', 'qwen_37_plus': 'Qwen3.7 Plus',
    'grok_4_7': 'Grok 4.7', 'mistral_large_4_0': 'Mistral Large 4', 'qwen_38_27b': 'Qwen3.8 27B',
    'kimi_k27': 'Kimi K2.7 Code', 'mimo_2_6_pro': 'MiMo-V2.6-Pro', 'o3': 'o3', 'gemma_4_31b_it': 'Gemma 4 31B',
    'inkling': 'Inkling', 'llama_4_maverick': 'Llama 4 Maverick', 'qwen_35_9b': 'Qwen3.5 9B',
    'nemotron_35_super_vl': 'Nemotron 3.5 Super VL', 'mistral_medium_35': 'Mistral Medium 3.5',
}

AA_CMP = 'https://artificialanalysis.ai/models/comparisons/'
WEB = {  # key: (tok/s, source, note)
    'claude_opus_45': (53.3, AA_CMP + 'claude-opus-4-5-thinking-vs-claude-4-5-haiku-reasoning', 'Opus 4.5 (Reasoning)'),
    'claude_sonnet_45': (42.0, AA_CMP + 'claude-4-5-haiku-reasoning-vs-claude-4-5-sonnet-thinking', 'Sonnet 4.5 (Reasoning)'),
    'claude_haiku_45': (94.9, AA_CMP + 'claude-4-5-haiku-reasoning-vs-claude-4-5-sonnet-thinking', 'Haiku 4.5, AA range 92-97'),
    'gpt_54_thinking_high': (73.0, AA_CMP + 'gpt-5-5-medium-vs-gpt-5-4', 'GPT-5.4 (Xhigh), 5-day rolling'),
    'gpt_55': (72.3, AA_CMP + 'gpt-5-5-high-vs-gpt-5-2', 'GPT-5.5 (High)'),
    'gpt_52': (77.3, AA_CMP + 'gpt-5-2-vs-gpt-4o', 'GPT-5.2 (Xhigh), mean of 83.2 and 71.4 on two AA pages'),
    'gpt_4o_2024_11_20': (124.9, AA_CMP + 'gpt-5-2-vs-gpt-4o', "GPT-4o (Nov '24)"),
    'gemini_25_pro': (109.8, AA_CMP + 'gemini-3-1-flash-lite-preview-vs-gemini-2-5-pro', 'Gemini 2.5 Pro'),
    'gemini_25_flash_lite': (288.0, AA_CMP + 'gemini-3-flash-vs-gemini-2-5-flash-lite', 'Gemini 2.5 Flash-Lite (Non-reasoning)'),
    'gemini_3_flash': (200.0, AA_CMP + 'gemini-3-flash-vs-gemini-2-5-flash-lite', 'Gemini 3 Flash'),
    'gemini_35_flash': (160.0, 'https://modelgrep.com/best/fastest/google', 'Gemini 3.5 Flash (modelgrep)'),
    'gemini_36_flash': (117.0, 'https://modelgrep.com/best/fastest/google', 'Gemini 3.6 Flash (modelgrep)'),
    'muse_spark_12': (200.0, 'https://www.benchleader.com/leaderboards/speed', 'Muse Spark 1.2 (BenchLeader, via AA)'),
    'kimi_k3': (64.0, 'https://lyceum.technology/magazine/llm-inference-tokens-per-second-comparison-2026/', 'Kimi K3 median 57-66'),
    'deepseek_v41_flash': (90.0, 'https://lyceum.technology/magazine/llm-inference-tokens-per-second-comparison-2026/', 'DeepSeek V4.1 Flash, 87-95'),
    'step_37_flash': (403.9, 'https://artificialanalysis.ai/leaderboards/models', 'Step 3.7 Flash (earlier AA snapshot)'),
}

PROXY = {  # key: (sibling key or AA release, note)
    'gpt_6_astra': ('aa:GPT-6.2 Astra', 'GPT-6.2 Astra'),
    'gpt_6_1_sol': ('aa:GPT-6.2 Sol', 'GPT-6.2 Sol'),
    'gpt_6_sol': ('aa:GPT-6.2 Sol', 'GPT-6.2 Sol'),
    'gpt_56': ('aa:GPT-6.2 Sol', 'GPT-6.2 Sol'),
    'gpt_56_terra': ('aa:GPT-6.1 Terra', 'GPT-6.1 Terra'),
    'gpt_56_luna': ('aa:GPT-6 Luna', 'GPT-6 Luna'),
    'claude_opus_5': ('aa:Claude Opus 5.5', 'Claude Opus 5.5'),
    'claude_opus_48': ('aa:Claude Opus 5.5', 'Claude Opus 5.5'),
    'claude_fable_5': ('aa:Claude Fable 5.2', 'Claude Fable 5.2'),
    'claude_fable_51': ('aa:Claude Fable 5.2', 'Claude Fable 5.2'),
    'claude_sonnet_46': ('claude_sonnet_45', 'Claude Sonnet 4.5'),
    'gemini_37_flash': ('gemini_36_flash', 'Gemini 3.6 Flash'),
    'gemini_38_flash': ('gemini_36_flash', 'Gemini 3.6 Flash'),
    'gpt_5': ('gpt_52', 'GPT-5.2'),
    'gpt_51': ('gpt_52', 'GPT-5.2'),
    'gpt_54_mini': (None, 'median of measured models'),
    'gpt_4o': ('gpt_4o_2024_11_20', "GPT-4o (Nov '24)"),
    'gpt_4o_2024_05_13': ('gpt_4o_2024_11_20', "GPT-4o (Nov '24)"),
    'gpt_4o_mini': (None, 'median of measured models'),
    'grok_45': ('aa:Grok 4.7', 'Grok 4.7'),
    'grok_46': ('aa:Grok 4.7', 'Grok 4.7'),
    'muse_spark_13': ('muse_spark_12', 'Muse Spark 1.2'),
    'qwen_38_max': ('aa:Qwen4 Max', 'Qwen4 Max'),
    'qwen_37_flash': ('aa:Qwen3.8-Flash-Next', 'Qwen3.8-Flash-Next'),
    'inkling_small': ('aa:Inkling 2 Small', 'Inkling 2 Small'),
    'qwen3_vl_235b_a22b_instruct': (None, 'median of measured models'),
    'qwen25_vl_72b_instruct': (None, 'median of measured models'),
    'mistral_large_2512': ('mistral_large_4_0', 'Mistral Large 4'),
    'nova_pro': ('aa:Nova 2.0 Pro Preview', 'Nova 2.0 Pro Preview (Non-reasoning)'),
}

effort = {m['model_key']: m['thinking_effort'] for m in idx['models']}
res = {}
for k, rel in MEASURED.items():
    name, v = aa_pick(rel, effort[k])
    res[k] = {'tps': v['tps'], 'latency': min_ttft(rel), 'basis': 'measured', 'source': AA_URL, 'note': f'AA {name}, {SNAP}'}
for k, (tps, src, note) in WEB.items():
    res[k] = {'tps': tps, 'latency': None, 'basis': 'web', 'source': src, 'note': note}
measured_tps = sorted(v['tps'] for v in res.values() if v['basis'] == 'measured')
median = measured_tps[len(measured_tps) // 2]
for k, (sib, note) in PROXY.items():
    if sib is None:
        tps, lat = median, None
    elif sib.startswith('aa:'):
        name, v = aa_pick(sib[3:], effort[k])
        tps, lat = v['tps'], min_ttft(sib[3:])
        note = f'AA {name}'
    else:
        tps, lat = res[sib]['tps'], res[sib]['latency']
    res[k] = {'tps': tps, 'latency': lat, 'basis': 'proxy', 'source': None, 'note': 'proxy: ' + note}
missing = [m['model_key'] for m in idx['models'] if m['model_key'] not in res]
assert not missing, missing
json.dump({'snapshot': SNAP, 'defaultLatencySec': 2.0, 'medianMeasuredTps': median,
           'models': dict(sorted(res.items()))}, open(out_path, 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(Counter(v['basis'] for v in res.values()), 'median', median)
