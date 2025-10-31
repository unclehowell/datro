import React from 'react';
import Section from './Section';

const ContactInfo: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center space-x-4 text-lg">
    <div className="text-amber-400">{icon}</div>
    <div>{children}</div>
  </div>
);

const Contact: React.FC = () => {
  return (
    <Section id="contact" title="Contact Information">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
            <ContactInfo icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}>
                <a href="mailto:platinumluxurytransfer@gmail.com" className="hover:text-amber-300">platinumluxurytransfer@gmail.com</a>
            </ContactInfo>
            <ContactInfo icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.211-.998-.552-1.348l-5.116-4.404a2.25 2.25 0 00-2.818.056L11.25 12.334a12.025 12.025 0 01-6.196-6.196l.44-1.29a2.25 2.25 0 00.056-2.818l-4.404-5.116A2.25 2.25 0 003.622 2.25H2.25z" /></svg>}>
                <a href="tel:+18098836434" className="hover:text-amber-300">+1 809 883 6434</a>
            </ContactInfo>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-slate-100">UK Address</h4>
            <p className="text-base">7 Bevans Terrace, Llansamlet, Winch Wen, SA7 9XR, Swansea, England & Wales</p>
            <p className="text-sm text-gray-400">Company Reg No: 15549430</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-100">Dominican Republic Branch</h4>
            <p className="text-base">Andeburg S.R.L., Torre Solazar, Piso 12B, Calle Gustavo Mejia Ricard No.54, Santo Domingo - Naco 10127, D.N.</p>
            <p className="text-sm text-gray-400">Registro mercantil: 198432SD</p>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Contact;