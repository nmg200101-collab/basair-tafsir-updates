from pathlib import Path
import importlib.util

spec = importlib.util.spec_from_file_location('sync_way2quran', Path(__file__).with_name('sync_way2quran.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def test_url():
    assert m.normalize_link('/ar/reciters/muhammad-hussein-amer/hafs-an-asim') == ('https://way2quran.com/ar/reciters/muhammad-hussein-amer','muhammad-hussein-amer')
    assert m.normalize_link('https://way2quran.com/ar/reciters/islam-sobhi') == ('https://way2quran.com/ar/reciters/islam-sobhi','islam-sobhi')
    assert m.normalize_link('https://evil.example/ar/reciters/test') is None
    assert m.normalize_link('javascript:alert(1)') is None
    assert m.normalize_link('https://way2quran.com/api/reciters') is None
    assert m.normalize_link('https://way2quran.com/ar/reciters/test?utm_campaign=hi') == ('https://way2quran.com/ar/reciters/test', 'test')

def test_names():
    assert m.choose_name('عبد الرحمن مسعد Abdul Rahman Musaad مختار🇪🇬مصري·1 قراءة', '', 'abdul-rahman-musaad') == 'عبد الرحمن مسعد'
    assert m.choose_name('محمد حسين عامر Muhammad Hussein Amer 🇾🇪يمني', '', 'muhammad-hussein-amer') == 'محمد حسين عامر'
    assert m.choose_name('Islam Sobhi', '', 'islam-sobhi') == ''

if __name__=='__main__':
    test_url();test_names(); print('8 URL/name assertions PASS')
