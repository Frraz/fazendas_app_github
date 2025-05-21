from flask import Blueprint, render_template

web_bp = Blueprint('web', __name__)

@web_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@web_bp.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@web_bp.route('/lembretes')
def lembretes():
    return render_template('lembretes.html')
