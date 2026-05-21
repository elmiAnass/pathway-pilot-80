
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('superadmin', 'agency_admin', 'student');
CREATE TYPE public.doc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.step_status AS ENUM ('locked', 'in_progress', 'submitted', 'approved');
CREATE TYPE public.application_status AS ENUM ('pending', 'submitted', 'accepted', 'rejected', 'waitlisted');

-- ============ AGENCIES ============
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#F5A623',
  logo_url TEXT,
  custom_domain TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  current_step INT NOT NULL DEFAULT 1,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  academic_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferred_language TEXT NOT NULL DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_agency_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_agency_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'agency_admin') OR public.has_role(auth.uid(), 'superadmin')
$$;

-- ============ UNIVERSITIES ============
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2),
  ranking INT,
  badges TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  step INT NOT NULL DEFAULT 2,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status public.doc_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ APPLICATIONS ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, university_id)
);

-- ============ STEP PROGRESS ============
CREATE TABLE public.step_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  step INT NOT NULL CHECK (step BETWEEN 1 AND 7),
  status public.step_status NOT NULL DEFAULT 'locked',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, step)
);

-- ============ INDEXES ============
CREATE INDEX idx_profiles_agency ON public.profiles(agency_id);
CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_documents_agency ON public.documents(agency_id);
CREATE INDEX idx_applications_user ON public.applications(user_id);
CREATE INDEX idx_universities_agency ON public.universities(agency_id);
CREATE INDEX idx_step_progress_user ON public.step_progress(user_id);

-- ============ ENABLE RLS ============
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_progress ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES: AGENCIES ============
CREATE POLICY "Members view own agency" ON public.agencies FOR SELECT TO authenticated
  USING (id = public.current_agency_id() OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage agencies" ON public.agencies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Agency admin update own agency" ON public.agencies FOR UPDATE TO authenticated
  USING (id = public.current_agency_id() AND public.has_role(auth.uid(), 'agency_admin'))
  WITH CHECK (id = public.current_agency_id() AND public.has_role(auth.uid(), 'agency_admin'));

-- ============ POLICIES: PROFILES ============
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Agency admin view agency profiles" ON public.profiles FOR SELECT TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin());
CREATE POLICY "Agency admin update agency profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin())
  WITH CHECK (agency_id = public.current_agency_id() AND public.is_agency_admin());
CREATE POLICY "Agency admin insert profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_agency_id() AND public.is_agency_admin());
CREATE POLICY "Superadmin all profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ============ POLICIES: USER_ROLES ============
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Agency admin view agency user roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_agency_admin() AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_roles.user_id AND p.agency_id = public.current_agency_id()
  ));
CREATE POLICY "Superadmin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ============ POLICIES: UNIVERSITIES ============
CREATE POLICY "Agency members view universities" ON public.universities FOR SELECT TO authenticated
  USING (agency_id = public.current_agency_id());
CREATE POLICY "Agency admin manage universities" ON public.universities FOR ALL TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin())
  WITH CHECK (agency_id = public.current_agency_id() AND public.is_agency_admin());

-- ============ POLICIES: DOCUMENTS ============
CREATE POLICY "Students view own documents" ON public.documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Students insert own documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND agency_id = public.current_agency_id());
CREATE POLICY "Students delete own pending documents" ON public.documents FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Agency admin view agency documents" ON public.documents FOR SELECT TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin());
CREATE POLICY "Agency admin update agency documents" ON public.documents FOR UPDATE TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin())
  WITH CHECK (agency_id = public.current_agency_id() AND public.is_agency_admin());

-- ============ POLICIES: APPLICATIONS ============
CREATE POLICY "Students view own applications" ON public.applications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Students manage own applications" ON public.applications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND agency_id = public.current_agency_id());
CREATE POLICY "Agency admin view agency applications" ON public.applications FOR SELECT TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin());
CREATE POLICY "Agency admin update agency applications" ON public.applications FOR UPDATE TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin())
  WITH CHECK (agency_id = public.current_agency_id() AND public.is_agency_admin());

-- ============ POLICIES: STEP_PROGRESS ============
CREATE POLICY "Students view own progress" ON public.step_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Students update own progress" ON public.step_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students insert own progress" ON public.step_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND agency_id = public.current_agency_id());
CREATE POLICY "Agency admin view agency progress" ON public.step_progress FOR SELECT TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin());
CREATE POLICY "Agency admin update agency progress" ON public.step_progress FOR UPDATE TO authenticated
  USING (agency_id = public.current_agency_id() AND public.is_agency_admin())
  WITH CHECK (agency_id = public.current_agency_id() AND public.is_agency_admin());

-- ============ TRIGGERS: updated_at ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_agencies_touch BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_step_touch BEFORE UPDATE ON public.step_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Students upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Students read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Students delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Agency admin read agency files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_agency_admin() AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.agency_id = public.current_agency_id()
  ));
