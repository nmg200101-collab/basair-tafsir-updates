import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
import tilawa_lock_guard as g

class TilawaLockTests(unittest.TestCase):
    def test_protected(self):
        for x in ('p92/owner-qa-001/release.json',
                  'p92/owner-qa-001/p116-qa050-qa045-with-print-zoom-smart-follow.js',
                  'p92/owner-qa-001/another.css',
                  'app-update-manifest.json',
                  'basair-tajweed-reference-manifest.json',
                  '.github/workflows/other-publisher.yml',
                  'ci/tilawa_lock_baseline.json',
                  '.github/CODEOWNERS',
                  'p121/owner-qa/modules/tilawa/p219-native-single-shadow-owner.js',
                  'p121/owner-qa/modules/tilawa/new-visual.css',
                  'p121/owner-qa/modules/tilawa/new-module.json'):
            self.assertTrue(g.protect(x),x)
    def test_other_departments_unrestricted(self):
        for x in ('library/assets/icons.svg','basair-surah-002-001.json',
                  'README.md','p92/owner-qa-001/review.md',
                  'ci/tilawa-approvals/signed-change.json',
                  'p121/owner-qa/modules/updates/p216-unified-update-center.js',
                  'p121/owner-qa/modules/tilawa/README.md'):
            self.assertFalse(g.protect(x),x)
    def test_canonical_order(self):
        self.assertEqual(g.canonical({'b':2,'a':1}),b'{"a":1,"b":2}')

if __name__=='__main__': unittest.main()
