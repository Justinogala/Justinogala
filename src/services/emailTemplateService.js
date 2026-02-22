
import { v4 as uuidv4 } from 'uuid';

const TEMPLATES_KEY = 'munal_email_templates';

const DEFAULT_TEMPLATES = [
  {
    id: 'welcome_email',
    name: 'Welcome Email',
    subject: 'Welcome to Munal!',
    body: '<h1>Welcome, {{name}}!</h1><p>We are excited to have you on board.</p>',
    isSystem: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'invite_email',
    name: 'Team Invitation',
    subject: 'You have been invited to join {{team_name}}',
    body: '<h1>Join the team</h1><p>Click here to accept the invitation.</p>',
    isSystem: true,
    lastUpdated: new Date().toISOString()
  }
];

const getTemplates = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
    // Merge defaults ensuring system templates always exist if not overridden/deleted?
    // For simplicity, we'll initialize if empty, but allow edits.
    if (stored.length === 0 && !localStorage.getItem(TEMPLATES_KEY)) {
      return DEFAULT_TEMPLATES;
    }
    return stored;
  } catch {
    return DEFAULT_TEMPLATES;
  }
};

const saveTemplates = (templates) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const emailTemplateService = {
  getAllTemplates: () => getTemplates(),

  getTemplate: (id) => {
    return getTemplates().find(t => t.id === id);
  },

  createTemplate: (name, subject, body) => {
    const templates = getTemplates();
    const newTemplate = {
      id: uuidv4(),
      name,
      subject,
      body,
      isSystem: false,
      lastUpdated: new Date().toISOString()
    };
    templates.push(newTemplate);
    saveTemplates(templates);
    return newTemplate;
  },

  updateTemplate: (id, updates) => {
    const templates = getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) throw new Error("Template not found");
    
    templates[index] = { 
      ...templates[index], 
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    saveTemplates(templates);
    return templates[index];
  },

  deleteTemplate: (id) => {
    const templates = getTemplates();
    const template = templates.find(t => t.id === id);
    
    if (template && template.isSystem) {
      throw new Error("Cannot delete system templates");
    }
    
    const filtered = templates.filter(t => t.id !== id);
    saveTemplates(filtered);
  },

  previewTemplate: (id, data = {}) => {
    const template = getTemplates().find(t => t.id === id);
    if (!template) return '';
    
    let content = template.body;
    Object.entries(data).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return content;
  }
};
