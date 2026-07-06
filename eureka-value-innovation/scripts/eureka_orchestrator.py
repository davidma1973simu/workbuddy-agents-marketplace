#!/usr/bin/env python3
"""
Eureka! AI 价值创新系统 - 主调度器
采用方法3：纯 Skills 组合，优先支持 WorkBuddy 对话调用
"""

import json
import sqlite3
from pathlib import Path
from datetime import datetime
import sys

# 路径配置
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUTS_DIR = DATA_DIR / "outputs"
ARCHIVE_DIR = DATA_DIR / "archive"
DB_PATH = DATA_DIR / "database" / "eureka.db"
TEMPLATES_DIR = BASE_DIR / "templates"


class EurekaOrchestrator:
    """Eureka 系统主调度器"""
    
    def __init__(self, project_id=None):
        self.project_id = project_id or self._generate_project_id()
        self.project_dir = OUTPUTS_DIR / self.project_id
        self.project_dir.mkdir(parents=True, exist_ok=True)
        self.db = self._get_db_connection()
    
    def _generate_project_id(self):
        """生成项目ID: vi_YYYYMMDD_001"""
        date_str = datetime.now().strftime("%Y%m%d")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM projects WHERE project_id LIKE ?",
            (f"vi_{date_str}_%",)
        )
        count = cursor.fetchone()[0]
        conn.close()
        return f"vi_{date_str}_{count + 1:03d}"
    
    def _get_db_connection(self):
        """获取数据库连接"""
        return sqlite3.connect(DB_PATH)
    
    def _save_stage_output(self, stage_num, stage_name, skill_name, output, status="completed", error=None):
        """保存阶段输出并记录到数据库"""
        timestamp = datetime.now().isoformat()
        output_file = self.project_dir / f"{stage_num:02d}_{skill_name}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        cursor = self.db.cursor()
        cursor.execute("""
            INSERT INTO stage_executions 
            (project_id, stage, stage_name, skill_name, status, started_at, completed_at, error_message, output_file)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (self.project_id, stage_num, stage_name, skill_name, status, timestamp, datetime.now().isoformat(), error, str(output_file)))
        self.db.commit()
        
        return output_file
    
    def _create_project_record(self, customer_requirement):
        """创建项目记录"""
        cursor = self.db.cursor()
        cursor.execute("""
            INSERT INTO projects (project_id, created_at, status, customer_requirement, current_stage, updated_at)
            VALUES (?, ?, 'running', ?, 'build', ?)
        """, (self.project_id, datetime.now().isoformat(), customer_requirement, datetime.now().isoformat()))
        self.db.commit()
    
    def _create_project_metadata(self, customer_requirement):
        """创建项目元数据文件"""
        metadata = {
            "project_id": self.project_id,
            "created_at": datetime.now().isoformat(),
            "status": "running",
            "customer_requirement": customer_requirement,
            "current_stage": "build",
            "stages": {
                "build": {"status": "pending", "skills": 1},
                "reveal": {"status": "pending", "skills": 3},
                "inspire": {"status": "pending", "skills": 3},
                "shape": {"status": "pending", "skills": 3},
                "exam": {"status": "pending", "skills": 4}
            },
            "final_deliverable": "99_final_dashboard.html"
        }
        
        metadata_file = self.project_dir / "00_project_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        return metadata_file
    
    def _update_project_metadata(self, stage_name, status):
        """更新项目元数据"""
        metadata_file = self.project_dir / "00_project_metadata.json"
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        metadata["current_stage"] = stage_name
        if status == "completed":
            metadata["stages"][stage_name]["status"] = "completed"
        elif status == "failed":
            metadata["status"] = "failed"
        
        metadata["updated_at"] = datetime.now().isoformat()
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    def _log_error(self, skill_name, error_message):
        """记录错误日志"""
        log_file = self.project_dir / "error.log"
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.now().isoformat()} | {skill_name} | ERROR: {error_message}\n")
    
    def run_workflow(self, customer_requirement):
        """
        执行完整工作流
        
        Args:
            customer_requirement: 用户需求描述（自然语言）
        
        Returns:
            dict: 包含项目信息和输出路径的字典
        """
        print(f"\n{'='*60}")
        print(f"Eureka! AI 价值创新系统 - 项目 {self.project_id}")
        print(f"{'='*60}")
        print(f"用户需求: {customer_requirement}")
        print(f"{'='*60}\n")
        
        # 创建项目记录
        self._create_project_record(customer_requirement)
        self._create_project_metadata(customer_requirement)
        
        try:
            # ========== 阶段 0: Build ==========
            print(f"[阶段 0/4] Build - 构建项目简报")
            build_output = self._execute_skill(
                stage_num=0,
                stage_name="build",
                skill_name="build_project_brief",
                input_data=customer_requirement
            )
            self._update_project_metadata("build", "completed")
            
            # ========== 阶段 1: Reveal ==========
            print(f"\n[阶段 1/4] Reveal - 用户洞察")
            pov_output = self._execute_skill(
                stage_num=1,
                stage_name="reveal",
                skill_name="pov_builder",
                input_data=build_output
            )
            insight_output = self._execute_skill(
                stage_num=2,
                stage_name="reveal",
                skill_name="find_insight",
                input_data=pov_output
            )
            stakeholder_output = self._execute_skill(
                stage_num=3,
                stage_name="reveal",
                skill_name="roleplay_stakeholder",
                input_data=build_output
            )
            self._update_project_metadata("reveal", "completed")
            
            # ========== 阶段 2: Inspire ==========
            print(f"\n[阶段 2/4] Inspire - 灵感生成")
            hmw_output = self._execute_skill(
                stage_num=4,
                stage_name="inspire",
                skill_name="hmw_reframer",
                input_data=pov_output
            )
            crosslink_output = self._execute_skill(
                stage_num=5,
                stage_name="inspire",
                skill_name="nco_crosslinker",
                input_data=hmw_output
            )
            idea_output = self._execute_skill(
                stage_num=6,
                stage_name="inspire",
                skill_name="idea_distiller",
                input_data=crosslink_output
            )
            self._update_project_metadata("inspire", "completed")
            
            # ========== 阶段 3: Shape ==========
            print(f"\n[阶段 3/4] Shape - 方案构建")
            interrogator_output = self._execute_skill(
                stage_num=7,
                stage_name="shape",
                skill_name="solution_interrogator",
                input_data=idea_output
            )
            solution_output = self._execute_skill(
                stage_num=8,
                stage_name="shape",
                skill_name="solution_build",
                input_data=interrogator_output
            )
            storyboard_output = self._execute_skill(
                stage_num=9,
                stage_name="shape",
                skill_name="storyboard_scriptor",
                input_data=solution_output
            )
            self._update_project_metadata("shape", "completed")
            
            # ========== 阶段 4: Exam ==========
            print(f"\n[阶段 4/4] Exam - 方案评估")
            aha_output = self._execute_skill(
                stage_num=10,
                stage_name="exam",
                skill_name="aha_map_evaluator",
                input_data=solution_output
            )
            pitch_output = self._execute_skill(
                stage_num=11,
                stage_name="exam",
                skill_name="pitch_composer",
                input_data={"solution": solution_output, "aha": aha_output}
            )
            iteration_output = self._execute_skill(
                stage_num=12,
                stage_name="exam",
                skill_name="project_iteration",
                input_data=solution_output
            )
            business_output = self._execute_skill(
                stage_num=13,
                stage_name="exam",
                skill_name="business_model",
                input_data={"solution": solution_output, "aha": aha_output}
            )
            self._update_project_metadata("exam", "completed")
            
            # ========== 最终产出: Final Dashboard ==========
            print(f"\n[最终] 生成一页纸看板")
            final_dashboard = self._generate_final_dashboard({
                "project_brief": build_output,
                "user_pov": pov_output,
                "insight": insight_output,
                "ideas": idea_output,
                "solution": solution_output,
                "evaluation": aha_output,
                "pitch": pitch_output,
                "iteration": iteration_output,
                "business_model": business_output
            })
            
            # 更新项目状态为完成
            cursor = self.db.cursor()
            cursor.execute("""
                UPDATE projects SET status='completed', current_stage='final', updated_at=?
                WHERE project_id=?
            """, (datetime.now().isoformat(), self.project_id))
            self.db.commit()
            
            print(f"\n{'='*60}")
            print(f"✅ 项目完成！")
            print(f"{'='*60}")
            print(f"项目ID: {self.project_id}")
            print(f"输出目录: {self.project_dir}")
            print(f"最终看板: {final_dashboard}")
            print(f"{'='*60}\n")
            
            return {
                "project_id": self.project_id,
                "status": "completed",
                "output_dir": str(self.project_dir),
                "final_dashboard": str(final_dashboard)
            }
        
        except Exception as e:
            # 记录错误
            error_msg = str(e)
            self._log_error("workflow", error_msg)
            
            cursor = self.db.cursor()
            cursor.execute("""
                UPDATE projects SET status='failed', current_stage='failed', updated_at=?
                WHERE project_id=?
            """, (datetime.now().isoformat(), self.project_id))
            self.db.commit()
            
            print(f"\n❌ 工作流执行失败: {error_msg}")
            print(f"错误日志: {self.project_dir / 'error.log'}")
            
            raise
    
    def _execute_skill(self, stage_num, stage_name, skill_name, input_data):
        """
        执行单个 Skill
        
        注意：这是占位符实现。实际实现需要与 WorkBuddy 主 agent 集成。
        当前使用模拟输出。
        """
        print(f"  → 执行 Skill: {skill_name}")
        
        try:
            # TODO: 实际调用 Skill
            # 目前返回模拟输出
            output = {
                "skill": skill_name,
                "stage": stage_name,
                "input_summary": str(input_data)[:100] + "..." if len(str(input_data)) > 100 else str(input_data),
                "output": f"[模拟输出] {skill_name} 执行结果",
                "timestamp": datetime.now().isoformat()
            }
            
            output_file = self._save_stage_output(stage_num, stage_name, skill_name, output, status="completed")
            print(f"  ✓ {skill_name} 完成")
            
            return output
        
        except Exception as e:
            error_msg = str(e)
            self._log_error(skill_name, error_msg)
            self._save_stage_output(stage_num, stage_name, skill_name, {}, status="failed", error=error_msg)
            print(f"  ✗ {skill_name} 失败: {error_msg}")
            raise
    
    def _generate_final_dashboard(self, all_outputs):
        """
        生成最终一页纸看板
        
        注意：这是占位符实现。实际实现需要读取 HTML 模板并填充数据。
        """
        # 暂时创建简单的 HTML 文件
        dashboard_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Eureka! - {self.project_id}</title>
    <style>
        body {{ font-family: 'PingFang SC', sans-serif; padding: 40px; background: #f5f5f5; }}
        .dashboard {{ max-width: 1200px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #1A1A2E; }}
        .section {{ margin: 30px 0; padding: 20px; border-left: 4px solid #FFC850; background: #FFF8E7; }}
        .timestamp {{ color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>Eureka! AI 价值创新系统</h1>
        <p class="timestamp">项目ID: {self.project_id} | 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="section">
            <h2>🎯 项目概览</h2>
            <p>本项目已成功完成全部 4 个阶段的 R.I.S.E. 工作流。</p>
        </div>
        
        <div class="section">
            <h2>📊 阶段产出</h2>
            <ul>
                <li>Build: 项目简报 (01_build_project_brief.json)</li>
                <li>Reveal: 用户 POV、FIND 洞察、利益相关方 (02-04)</li>
                <li>Inspire: HMW 机遇、创意 (05-06)</li>
                <li>Shape: 方案构建、故事脚本 (07-09)</li>
                <li>Exam: AHA MAP、电梯演讲、迭代计划、商业模式 (10-13)</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>🚀 下一步行动</h2>
            <p>请查看各阶段的详细 JSON 输出文件，或使用客户应用加载本看板。</p>
        </div>
    </div>
</body>
</html>"""
        
        dashboard_file = self.project_dir / "99_final_dashboard.html"
        with open(dashboard_file, 'w', encoding='utf-8') as f:
            f.write(dashboard_content)
        
        # 记录交付物
        cursor = self.db.cursor()
        cursor.execute("""
            INSERT INTO deliverables (project_id, deliverable_type, file_path, created_at)
            VALUES (?, ?, ?, ?)
        """, (self.project_id, "final_dashboard", str(dashboard_file), datetime.now().isoformat()))
        self.db.commit()
        
        return dashboard_file
    
    def close(self):
        """关闭数据库连接"""
        if self.db:
            self.db.close()


def main():
    """命令行入口"""
    if len(sys.argv) < 2:
        print("用法: python3 eureka_orchestrator.py \"客户需求描述\"")
        print("示例: python3 eureka_orchestrator.py \"用户需要在工作回顾中做出更明确的承诺\"")
        sys.exit(1)
    
    customer_requirement = " ".join(sys.argv[1:])
    
    orchestrator = EurekaOrchestrator()
    try:
        result = orchestrator.run_workflow(customer_requirement)
        print(f"\n🎉 成功！项目信息: {result}")
    finally:
        orchestrator.close()


if __name__ == "__main__":
    main()
