#!/usr/bin/env python3
"""
Eureka! 客户应用扫描脚本
定期扫描 data/outputs/ 目录，检测新项目并通知客户应用
"""

import json
import time
from pathlib import Path
from datetime import datetime

# 配置
OUTPUTS_DIR = Path(__file__).parent.parent / "data" / "outputs"
SCAN_INTERVAL = 60  # 扫描间隔（秒）

class ProjectScanner:
    """项目扫描器"""
    
    def __init__(self, outputs_dir=None):
        self.outputs_dir = Path(outputs_dir) if outputs_dir else OUTPUTS_DIR
        self.known_projects = set()
        self._load_known_projects()
    
    def _load_known_projects(self):
        """加载已知项目"""
        metadata_file = self.outputs_dir / ".scanner_state.json"
        if metadata_file.exists():
            with open(metadata_file, 'r', encoding='utf-8') as f:
                state = json.load(f)
                self.known_projects = set(state.get("known_projects", []))
    
    def _save_known_projects(self):
        """保存已知项目"""
        metadata_file = self.outputs_dir / ".scanner_state.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump({"known_projects": list(self.known_projects)}, f, indent=2)
    
    def _scan_projects(self):
        """扫描所有项目"""
        new_projects = []
        
        for project_dir in self.outputs_dir.iterdir():
            if not project_dir.is_dir():
                continue
            
            metadata_file = project_dir / "00_project_metadata.json"
            if not metadata_file.exists():
                continue
            
            project_id = project_dir.name
            
            # 读取元数据
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            status = metadata.get("status", "unknown")
            final_deliverable = metadata.get("final_deliverable", "")
            
            # 新项目
            if project_id not in self.known_projects:
                self.known_projects.add(project_id)
                new_projects.append({
                    "project_id": project_id,
                    "status": status,
                    "final_deliverable": project_dir / final_deliverable if final_deliverable else None
                })
        
        # 保存状态
        if new_projects:
            self._save_known_projects()
        
        return new_projects
    
    def _notify(self, projects):
        """通知客户应用"""
        for project in projects:
            print(f"\n{'='*60}")
            print(f"🎉 新项目检测到: {project['project_id']}")
            print(f"{'='*60}")
            print(f"状态: {project['status']}")
            if project['final_deliverable']:
                print(f"最终交付物: {project['final_deliverable']}")
            print(f"{'='*60}\n")
    
    def run(self, once=False):
        """运行扫描器"""
        print(f"🔍 Eureka! 项目扫描器启动")
        print(f"扫描目录: {self.outputs_dir}")
        print(f"扫描间隔: {SCAN_INTERVAL} 秒")
        print(f"{'='*60}\n")
        
        try:
            while True:
                new_projects = self._scan_projects()
                
                if new_projects:
                    self._notify(new_projects)
                
                if once:
                    break
                
                time.sleep(SCAN_INTERVAL)
        
        except KeyboardInterrupt:
            print(f"\n\n扫描器已停止")
        
        except Exception as e:
            print(f"\n❌ 扫描器错误: {e}")
            raise


def main():
    """命令行入口"""
    import sys
    
    once = "--once" in sys.argv
    outputs_dir = None
    
    # 解析参数
    if len(sys.argv) > 1 and sys.argv[1] != "--once":
        outputs_dir = sys.argv[1]
    
    scanner = ProjectScanner(outputs_dir)
    scanner.run(once=once)


if __name__ == "__main__":
    main()
